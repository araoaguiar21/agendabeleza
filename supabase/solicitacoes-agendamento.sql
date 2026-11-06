-- Agendamento online: pedido pendente, protegido contra leitura pública.
-- Requer supabase/agenda.sql e supabase/configuracoes.sql.
-- Execute no SQL Editor. Ainda são necessários antispam/CAPTCHA e política de privacidade
-- ANTES de divulgar este formulário ao público em produção.
begin;

create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 120),
  phone text not null check (phone ~ '^[0-9]{10,15}$'),
  service_name text not null check (char_length(btrim(service_name)) between 1 and 120),
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'Pendente'
    check (status in ('Pendente','Aceito','Recusado')),
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists appointment_requests_pending_idx
  on public.appointment_requests(created_at desc)
  where status = 'Pendente';
create index if not exists appointment_requests_phone_idx
  on public.appointment_requests(phone,created_at desc);

alter table public.appointment_requests enable row level security;
revoke all on table public.appointment_requests from public, anon, authenticated;
grant select,update,delete on public.appointment_requests to authenticated;

drop policy if exists "booking_requests_admin_read" on public.appointment_requests;
create policy "booking_requests_admin_read"
  on public.appointment_requests for select to authenticated
  using ((select private.is_studio_admin()));

drop policy if exists "booking_requests_admin_update" on public.appointment_requests;
create policy "booking_requests_admin_update"
  on public.appointment_requests for update to authenticated
  using ((select private.is_studio_admin()))
  with check ((select private.is_studio_admin()));

drop policy if exists "booking_requests_admin_delete" on public.appointment_requests;
create policy "booking_requests_admin_delete"
  on public.appointment_requests for delete to authenticated
  using ((select private.is_studio_admin()));

-- Clientes só podem INSERIR um pedido por função, nunca ler dados da tabela.
create or replace function public.request_studio_appointment(
  p_name text,
  p_phone text,
  p_service text,
  p_day date,
  p_time time
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_now timestamp := now() at time zone 'America/Sao_Paulo';
  v_phone text := regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
  v_name text := btrim(coalesce(p_name,''));
  v_service text := btrim(coalesce(p_service,''));
  v_allowed text[];
begin
  if char_length(v_name) not between 2 and 120 or v_name ~ '[<>]' then
    return jsonb_build_object('ok',false,'message','Informe um nome válido.');
  end if;
  if v_phone !~ '^[0-9]{10,11}$' then
    return jsonb_build_object('ok',false,'message','Informe um celular com DDD.');
  end if;
  if p_day is null or p_day < v_now::date or p_day > v_now::date + 90
     or p_time is null or (p_day = v_now::date and p_time <= v_now::time) then
    return jsonb_build_object('ok',false,'message','Escolha uma data e horário futuros.');
  end if;

  select s.time_slots into v_allowed
  from public.studio_settings as s
  where s.id = 'main';
  if v_allowed is null or not (to_char(p_time,'HH24:MI') = any(v_allowed)) then
    return jsonb_build_object('ok',false,'message','Horário não disponível para solicitações.');
  end if;

  if not exists (
    select 1 from public.services as s
    where s.name = v_service and s.active = true
  ) then
    return jsonb_build_object('ok',false,'message','Escolha um serviço ativo.');
  end if;

  if exists (
    select 1 from public.appointments as a
    where a.appointment_date = p_day
      and a.appointment_time = p_time
      and a.status = 'Agendado'
  ) then
    return jsonb_build_object('ok',false,'message','Esse horário já está reservado.');
  end if;

  -- Controle básico de abuso: 1 pedido a cada 15 min e até 3 pendentes por telefone.
  -- Para produção adicionar CAPTCHA + rate limit por IP em Edge Function.
  if exists (
    select 1 from public.appointment_requests as r
    where r.phone = v_phone and r.created_at >= now() - interval '15 minutes'
  ) then
    return jsonb_build_object('ok',false,
      'message','Já recebemos uma solicitação recente desse telefone. Aguarde 15 minutos.');
  end if;
  if (
    select count(*) from public.appointment_requests as r
    where r.phone = v_phone and r.status = 'Pendente'
  ) >= 3 then
    return jsonb_build_object('ok',false,
      'message','Já existem solicitações pendentes desse telefone.');
  end if;
  if (
    select count(*) from public.appointment_requests as r
    where r.created_at >= now() - interval '1 day'
  ) >= 200 then
    return jsonb_build_object('ok',false,
      'message','Limite temporário de pedidos atingido. Fale conosco pelo WhatsApp.');
  end if;

  insert into public.appointment_requests
    (customer_name,phone,service_name,appointment_date,appointment_time)
  values (v_name,v_phone,v_service,p_day,p_time);

  return jsonb_build_object('ok',true,'message',
    'Pedido registrado! Aguarde a confirmação da Letícia pelo WhatsApp.');
end;
$function$;

revoke all on function public.request_studio_appointment(text,text,text,date,time)
  from public,anon,authenticated;
grant execute on function public.request_studio_appointment(text,text,text,date,time)
  to anon,authenticated;

-- Confirmação ATÔMICA: solicitações concorrentes não podem ocupar o mesmo horário.
create or replace function public.accept_studio_appointment(p_request_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_request public.appointment_requests%rowtype;
  v_appointment_id uuid;
  v_price integer := 0;
begin
  if not private.is_studio_admin() then
    return jsonb_build_object('ok',false,'message','Acesso não autorizado.');
  end if;

  select * into v_request
  from public.appointment_requests where id = p_request_id for update;

  if not found then
    return jsonb_build_object('ok',false,'message','Solicitação não encontrada.');
  end if;
  if v_request.status <> 'Pendente' then
    return jsonb_build_object('ok',false,'message','Solicitação já analisada.');
  end if;

  select coalesce(s.price_cents,0) into v_price
  from public.services as s
  where s.name = v_request.service_name and s.active = true
  limit 1;
  v_price := coalesce(v_price,0);

  insert into public.appointments (
    customer_name,phone,service_name,appointment_date,appointment_time,
    status,price_cents
  ) values (
    v_request.customer_name,v_request.phone,v_request.service_name,
    v_request.appointment_date,v_request.appointment_time,'Agendado',v_price
  ) returning id into v_appointment_id;

  update public.appointment_requests
    set status='Aceito',appointment_id=v_appointment_id
    where id=v_request.id;

  return jsonb_build_object('ok',true,'appointment_id',v_appointment_id);
exception
  when unique_violation then
    return jsonb_build_object('ok',false,
      'message','Esse horário já foi ocupado. Escolha outro horário antes de confirmar.');
end;
$function$;

revoke all on function public.accept_studio_appointment(uuid)
  from public,anon,authenticated;
grant execute on function public.accept_studio_appointment(uuid) to authenticated;

commit;
