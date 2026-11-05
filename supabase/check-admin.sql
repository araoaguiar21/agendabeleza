-- Etapa 3: permite que o site confirme se a pessoa autenticada é administradora.
-- Depende de secure-policies.sql ter sido executado.
create or replace function public.can_manage_studio()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_studio_admin();
$$;

revoke all on function public.can_manage_studio() from public, anon, authenticated;
grant execute on function public.can_manage_studio() to authenticated;
