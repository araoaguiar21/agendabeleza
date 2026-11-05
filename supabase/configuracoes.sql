-- Configurações públicas editáveis pela administradora.
begin;
create table if not exists public.studio_settings (
 id text primary key default 'main' check (id='main'),
 salon_name text not null default 'Letícia Soares | Nail Designer'
   check (char_length(salon_name) between 2 and 100),
 owner_name text not null default 'Letícia Soares'
   check (char_length(owner_name) between 2 and 100),
 slogan text not null default '',
 whatsapp text not null default '' check (whatsapp ~ '^[0-9]{0,15}$'),
 instagram text not null default '',
 address text not null default '',
 theme_color text not null default '#a83961'
   check (theme_color ~ '^#[0-9a-fA-F]{6}$'),
 time_slots text[] not null default array[
   '08:00','09:00','10:00','11:00','12:00','13:00',
   '14:00','15:00','16:00','17:00','18:00','19:00'
 ],
 inactive_days integer not null default 21
   check (inactive_days between 1 and 3650),
 updated_at timestamptz not null default now()
);
alter table public.studio_settings enable row level security;
revoke all on public.studio_settings from public,anon,authenticated;
grant select on public.studio_settings to anon,authenticated;
grant insert,update on public.studio_settings to authenticated;
drop policy if exists "settings_public_read" on public.studio_settings;
create policy "settings_public_read" on public.studio_settings
 for select to anon,authenticated using (true);
drop policy if exists "settings_admin_insert" on public.studio_settings;
create policy "settings_admin_insert" on public.studio_settings
 for insert to authenticated
 with check ((select private.is_studio_admin()));
drop policy if exists "settings_admin_update" on public.studio_settings;
create policy "settings_admin_update" on public.studio_settings
 for update to authenticated
 using ((select private.is_studio_admin()))
 with check ((select private.is_studio_admin()));
insert into public.studio_settings (id)
 values ('main') on conflict (id) do nothing;
commit;
