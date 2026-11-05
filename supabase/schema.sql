-- Academia Letícia Soares — esquema inicial do Supabase
-- Execute no SQL Editor do SEU projeto Supabase.
-- RLS: público vê apenas registros publicados; só admin autorizado modifica.
begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  duration_minutes integer not null default 60
    check (duration_minutes between 0 and 1440),
  emoji text not null default '💅',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null default '',
  format text not null default 'turma' check (format in ('turma', 'continuo')),
  price_cents integer check (price_cents is null or price_cents >= 0),
  start_date date,
  end_date date,
  days_description text not null default '',
  start_time time,
  end_time time,
  capacity integer check (capacity is null or capacity > 0),
  location text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint courses_dates_ok check (
    end_date is null or start_date is null or end_date >= start_date
  ),
  constraint courses_times_ok check (
    end_time is null or start_time is null or end_time > start_time
  )
);

alter table public.admin_users enable row level security;
alter table public.services enable row level security;
alter table public.courses enable row level security;

-- Controle de acesso: a lista de administradoras é fechada por padrão.
revoke all on table public.admin_users from public, anon, authenticated;
revoke all on table public.services from public, anon, authenticated;
revoke all on table public.courses from public, anon, authenticated;

grant select on table public.services, public.courses to anon, authenticated;
grant insert, update, delete on table public.services, public.courses to authenticated;

-- SECURITY DEFINER lê somente a associação do próprio usuário autenticado.
create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users as a
    where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_studio_admin() from public, anon, authenticated;
grant execute on function public.is_studio_admin() to authenticated;

-- Serviços: visitantes só veem os ativos.
drop policy if exists "services_public_read" on public.services;
create policy "services_public_read"
on public.services for select to anon, authenticated
using (active = true);

drop policy if exists "services_admin_read" on public.services;
create policy "services_admin_read"
on public.services for select to authenticated
using ((select public.is_studio_admin()));

drop policy if exists "services_admin_insert" on public.services;
create policy "services_admin_insert"
on public.services for insert to authenticated
with check ((select public.is_studio_admin()));

drop policy if exists "services_admin_update" on public.services;
create policy "services_admin_update"
on public.services for update to authenticated
using ((select public.is_studio_admin()))
with check ((select public.is_studio_admin()));

drop policy if exists "services_admin_delete" on public.services;
create policy "services_admin_delete"
on public.services for delete to authenticated
using ((select public.is_studio_admin()));

-- Cursos: visitantes só veem os publicados.
drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read"
on public.courses for select to anon, authenticated
using (published = true);

drop policy if exists "courses_admin_read" on public.courses;
create policy "courses_admin_read"
on public.courses for select to authenticated
using ((select public.is_studio_admin()));

drop policy if exists "courses_admin_insert" on public.courses;
create policy "courses_admin_insert"
on public.courses for insert to authenticated
with check ((select public.is_studio_admin()));

drop policy if exists "courses_admin_update" on public.courses;
create policy "courses_admin_update"
on public.courses for update to authenticated
using ((select public.is_studio_admin()))
with check ((select public.is_studio_admin()));

drop policy if exists "courses_admin_delete" on public.courses;
create policy "courses_admin_delete"
on public.courses for delete to authenticated
using ((select public.is_studio_admin()));

commit;
