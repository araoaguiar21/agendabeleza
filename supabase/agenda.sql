-- Etapa 4: agenda privada da Letícia no Supabase.
-- Execute depois de secure-policies.sql e check-admin.sql.
-- Os dados pessoais das clientes NÃO podem ser lidos por visitantes.
begin;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 120),
  phone text not null check (phone ~ '^[0-9]{10,15}$'),
  service_name text not null check (char_length(btrim(service_name)) between 1 and 120),
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'Agendado'
    check (status in ('Agendado', 'Concluido', 'Cancelado')),
  price_cents integer not null default 0 check (price_cents >= 0),
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Apenas um atendimento agendado por data e horário.
create unique index if not exists appointments_unique_active_slot
  on public.appointments(appointment_date, appointment_time)
  where status = 'Agendado';

create index if not exists appointments_date_idx
  on public.appointments(appointment_date, appointment_time);
create index if not exists appointments_phone_idx
  on public.appointments(phone);

alter table public.appointments enable row level security;
revoke all on table public.appointments from public, anon, authenticated;
grant select, insert, update, delete on public.appointments to authenticated;

drop policy if exists "appointments_admin_read" on public.appointments;
create policy "appointments_admin_read"
on public.appointments for select to authenticated
using ((select private.is_studio_admin()));

drop policy if exists "appointments_admin_insert" on public.appointments;
create policy "appointments_admin_insert"
on public.appointments for insert to authenticated
with check ((select private.is_studio_admin()));

drop policy if exists "appointments_admin_update" on public.appointments;
create policy "appointments_admin_update"
on public.appointments for update to authenticated
using ((select private.is_studio_admin()))
with check ((select private.is_studio_admin()));

drop policy if exists "appointments_admin_delete" on public.appointments;
create policy "appointments_admin_delete"
on public.appointments for delete to authenticated
using ((select private.is_studio_admin()));

commit;
