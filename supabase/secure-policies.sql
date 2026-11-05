-- Correção de segurança: função de administração fora do schema público.
-- Executar após supabase/schema.sql, no SQL Editor do Supabase.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_studio_admin()
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

revoke all on function private.is_studio_admin() from public, anon, authenticated;
grant execute on function private.is_studio_admin() to authenticated;

alter policy "services_admin_read" on public.services
  using ((select private.is_studio_admin()));
alter policy "services_admin_insert" on public.services
  with check ((select private.is_studio_admin()));
alter policy "services_admin_update" on public.services
  using ((select private.is_studio_admin()))
  with check ((select private.is_studio_admin()));
alter policy "services_admin_delete" on public.services
  using ((select private.is_studio_admin()));

alter policy "courses_admin_read" on public.courses
  using ((select private.is_studio_admin()));
alter policy "courses_admin_insert" on public.courses
  with check ((select private.is_studio_admin()));
alter policy "courses_admin_update" on public.courses
  using ((select private.is_studio_admin()))
  with check ((select private.is_studio_admin()));
alter policy "courses_admin_delete" on public.courses
  using ((select private.is_studio_admin()));

drop function if exists public.is_studio_admin();

commit;
