-- ETAPA: durações reais + bloqueios de folgas/férias.
-- Executar após agenda.sql, configuracoes.sql e solicitacoes-agendamento.sql.
-- Horários são tratados como horários locais do Rio/São Paulo (sem conversão UTC).
-- Esta migração NÃO apaga os dados antigos.
begin;

alter table public.appointments
  add column if not exists duration_minutes integer not null default 60;

-- Agendamentos antigos não tinham duração: preservados com duração padrão de 60 min.
-- A administradora pode editar individualmente a duração dos já existentes.
alter table public.appointments drop constraint if exists appointments_duration_range;
alter table public.appointments add constraint appointments_duration_range
  check (duration_minutes between 15 and 1440);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  start_at timestamp without time zone not null,
  end_at timestamp without time zone not null,
  reason text not null default '' check (char_length(reason) <= 160),
  created_at timestamptz not null default now(),
  constraint schedule_blocks_positive_interval check (end_at > start_at)
);

create index if not exists schedule_blocks_period_idx
  on public.schedule_blocks(start_at,end_at);

alter table public.schedule_blocks enable row level security;
revoke all on public.schedule_blocks from public,anon,authenticated;
grant select,insert,update,delete on public.schedule_blocks to authenticated;

drop policy if exists "blocks_admin_select" on public.schedule_blocks;
create policy "blocks_admin_select" on public.schedule_blocks
  for select to authenticated
  using ((select private.is_studio_admin()));

drop policy if exists "blocks_admin_insert" on public.schedule_blocks;
create policy "blocks_admin_insert" on public.schedule_blocks
  for insert to authenticated
  with check ((select private.is_studio_admin()));

drop policy if exists "blocks_admin_update" on public.schedule_blocks;
create policy "blocks_admin_update" on public.schedule_blocks
  for update to authenticated
  using ((select private.is_studio_admin()))
  with check ((select private.is_studio_admin()));

drop policy if exists "blocks_admin_delete" on public.schedule_blocks;
create policy "blocks_admin_delete" on public.schedule_blocks
  for delete to authenticated
  using ((select private.is_studio_admin()));

-- Serializa operações na agenda e bloqueios para evitar corrida entre dispositivos.
create or replace function private.guard_appointment_interval()
returns trigger
language plpgsql volatile security definer
set search_path = ''
as $body$
declare
  v_inicio timestamp without time zone;
  v_fim timestamp without time zone;
begin
  perform pg_catalog.pg_advisory_xact_lock(40719, 1);
  if new.status <> 'Agendado' then return new; end if;

  v_inicio := new.appointment_date + new.appointment_time;
  v_fim := v_inicio + new.duration_minutes * interval '1 minute';

  if exists (
    select 1 from public.schedule_blocks b
    where b.start_at < v_fim and b.end_at > v_inicio
  ) then
    raise exception using errcode='23514',
      message='Este intervalo está bloqueado para folga, férias ou compromisso.';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.id <> new.id and a.status = 'Agendado'
      and (a.appointment_date + a.appointment_time) < v_fim
      and (a.appointment_date + a.appointment_time +
          a.duration_minutes * interval '1 minute') > v_inicio
  ) then
    raise exception using errcode='23505',
      message='Já existe outro atendimento durante esse intervalo.';
  end if;

  return new;
end;
$body$;

drop trigger if exists appointments_guard_interval on public.appointments;
create trigger appointments_guard_interval
before insert or update of appointment_date,appointment_time,duration_minutes,status
on public.appointments
for each row execute function private.guard_appointment_interval();

create or replace function private.guard_block_interval()
returns trigger
language plpgsql volatile security definer
set search_path = ''
as $body$
begin
  perform pg_catalog.pg_advisory_xact_lock(40719, 1);
  if exists (
    select 1 from public.appointments a
    where a.status = 'Agendado'
      and a.appointment_date + a.appointment_time < new.end_at
      and a.appointment_date + a.appointment_time +
          a.duration_minutes * interval '1 minute' > new.start_at
  ) then
    raise exception using errcode='23514',
      message='Há atendimento confirmado nesse período. Reagende-o antes de bloquear.';
  end if;
  return new;
end;
$body$;

drop trigger if exists schedule_blocks_guard_interval on public.schedule_blocks;
create trigger schedule_blocks_guard_interval
before insert or update of start_at,end_at
on public.schedule_blocks
for each row execute function private.guard_block_interval();

-- Só devolve uma lista de horários. Nenhum nome ou telefone é exposto.
create or replace function public.available_studio_slots(
  p_day date, p_service text
)
returns table(slot text)
language plpgsql stable security definer
set search_path = ''
as $body$
declare
  v_minutes integer;
  v_now timestamp without time zone := now() at time zone 'America/Sao_Paulo';
begin
  if p_day is null or p_day < v_now::date or p_day > v_now::date + 90 then
    return;
  end if;

  select greatest(s.duration_minutes,15) into v_minutes
  from public.services s
  where s.name = p_service and s.active = true
  order by s.created_at desc limit 1;

  if v_minutes is null then return; end if;

  return query
  select h.t as slot
  from (
    select distinct unnest(st.time_slots) as t
    from public.studio_settings st where st.id='main'
  ) h
  where h.t ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    and (p_day + h.t::time) > v_now
    and not exists (
      select 1 from public.schedule_blocks b
      where b.start_at < (p_day + h.t::time + v_minutes * interval '1 minute')
        and b.end_at > (p_day + h.t::time)
    )
    and not exists (
      select 1 from public.appointments a
      where a.status = 'Agendado'
        and a.appointment_date + a.appointment_time <
            p_day + h.t::time + v_minutes * interval '1 minute'
        and a.appointment_date + a.appointment_time +
            a.duration_minutes * interval '1 minute' > p_day + h.t::time
    )
  order by slot;
end;
$body$;

revoke all on function public.available_studio_slots(date,text)
  from public,anon,authenticated;
grant execute on function public.available_studio_slots(date,text)
  to anon,authenticated;

-- Atualiza validação dos pedidos, respeitando duração e folgas.
create or replace function public.request_studio_appointment(
  p_name text, p_phone text, p_service text, p_day date, p_time time
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $body$
declare
  v_now timestamp without time zone := now() at time zone 'America/Sao_Paulo';
  v_phone text := regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
  v_name text := btrim(coalesce(p_name,''));
  v_service text := btrim(coalesce(p_service,''));
begin
  if char_length(v_name) not between 2 and 120 or v_name ~ '[<>]' then
    return jsonb_build_object('ok',false,'message','Informe um nome válido.');
  end if;
  if v_phone !~ '^[0-9]{10,11}$' then
    return jsonb_build_object('ok',false,'message','Informe um celular com DDD.');
  end if;
  if p_day is null or p_time is null or p_day < v_now::date
     or p_day > v_now::date + 90
     or (p_day + p_time) <= v_now then
    return jsonb_build_object('ok',false,'message','Escolha uma data e horário futuros.');
  end if;
  if not exists (
    select 1 from public.available_studio_slots(p_day,v_service) a
    where a.slot = to_char(p_time,'HH24:MI')
  ) then
    return jsonb_build_object('ok',false,
      'message','Esse horário está ocupado, bloqueado ou não atende à duração do serviço.');
  end if;

  -- Bloqueio básico por telefone (não substitui CAPTCHA/rate limit por IP).
  if exists (
    select 1 from public.appointment_requests r
    where r.phone = v_phone and r.created_at >= now() - interval '15 minutes'
  ) then
    return jsonb_build_object('ok',false,
      'message','Já recebemos um pedido recente deste número. Aguarde 15 minutos.');
  end if;
  if (
    select count(*) from public.appointment_requests r
    where r.phone = v_phone and r.status='Pendente'
  ) >= 3 then
    return jsonb_build_object('ok',false,
      'message','Há pedidos pendentes demais para esse número.');
  end if;
  if (
    select count(*) from public.appointment_requests r
    where r.created_at >= now() - interval '1 day'
  ) >= 200 then
    return jsonb_build_object('ok',false,
      'message','Limite diário atingido. Entre em contato pelo WhatsApp.');
  end if;

  insert into public.appointment_requests
    (customer_name,phone,service_name,appointment_date,appointment_time)
  values (v_name,v_phone,v_service,p_day,p_time);

  return jsonb_build_object('ok',true,
    'message','Solicitação recebida. Aguarde confirmação pelo WhatsApp.');
end;
$body$;

revoke all on function public.request_studio_appointment(text,text,text,date,time)
  from public,anon,authenticated;
grant execute on function public.request_studio_appointment(text,text,text,date,time)
  to anon,authenticated;

-- Aprovação atômica continua protegida pelos triggers de intervalos.
create or replace function public.accept_studio_appointment(p_request_id uuid)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $body$
declare
  v_request public.appointment_requests%rowtype;
  v_id uuid;
  v_price integer := 0;
  v_minutes integer := 60;
begin
  if not private.is_studio_admin() then
    return jsonb_build_object('ok',false,'message','Acesso não autorizado.');
  end if;

  select * into v_request from public.appointment_requests
    where id=p_request_id for update;
  if not found then
    return jsonb_build_object('ok',false,'message','Pedido não encontrado.');
  end if;
  if v_request.status <> 'Pendente' then
    return jsonb_build_object('ok',false,'message','Este pedido já foi analisado.');
  end if;

  select s.price_cents,greatest(s.duration_minutes,15)
    into v_price,v_minutes
  from public.services s where s.name=v_request.service_name
  order by s.created_at desc limit 1;

  insert into public.appointments (
    customer_name,phone,service_name,appointment_date,appointment_time,
    status,price_cents,duration_minutes
  ) values (
    v_request.customer_name,v_request.phone,v_request.service_name,
    v_request.appointment_date,v_request.appointment_time,'Agendado',
    coalesce(v_price,0),coalesce(v_minutes,60)
  ) returning id into v_id;

  update public.appointment_requests
  set status='Aceito',appointment_id=v_id where id=v_request.id;

  return jsonb_build_object('ok',true,'appointment_id',v_id);
exception when unique_violation or check_violation then
  return jsonb_build_object('ok',false,
    'message','Não é possível confirmar: horário ocupado ou bloqueado.');
end;
$body$;

revoke all on function public.accept_studio_appointment(uuid)
  from public,anon,authenticated;
grant execute on function public.accept_studio_appointment(uuid)
  to authenticated;

commit;
