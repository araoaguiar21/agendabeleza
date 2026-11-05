-- Galeria pública de trabalhos. Execute no SQL Editor do Supabase.
-- Fotos são públicas para quem tiver o link; envie apenas imagens autorizadas.
begin;

create table if not exists public.portfolio_photos (
 id uuid primary key default gen_random_uuid(),
 storage_path text not null unique
   check (storage_path ~ '^works/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$'),
 caption text not null default '' check (char_length(caption) <= 240),
 published boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.portfolio_photos enable row level security;
revoke all on public.portfolio_photos from public, anon, authenticated;
grant select on public.portfolio_photos to anon, authenticated;
grant insert, update, delete on public.portfolio_photos to authenticated;

drop policy if exists "portfolio_public_read" on public.portfolio_photos;
create policy "portfolio_public_read" on public.portfolio_photos
 for select to anon, authenticated using (published = true);
drop policy if exists "portfolio_admin_read" on public.portfolio_photos;
create policy "portfolio_admin_read" on public.portfolio_photos
 for select to authenticated using ((select private.is_studio_admin()));
drop policy if exists "portfolio_admin_insert" on public.portfolio_photos;
create policy "portfolio_admin_insert" on public.portfolio_photos
 for insert to authenticated with check ((select private.is_studio_admin()));
drop policy if exists "portfolio_admin_update" on public.portfolio_photos;
create policy "portfolio_admin_update" on public.portfolio_photos
 for update to authenticated using ((select private.is_studio_admin()))
 with check ((select private.is_studio_admin()));
drop policy if exists "portfolio_admin_delete" on public.portfolio_photos;
create policy "portfolio_admin_delete" on public.portfolio_photos
 for delete to authenticated using ((select private.is_studio_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 values ('leticia-portfolio', 'leticia-portfolio', true, 5242880,
 array['image/jpeg', 'image/png', 'image/webp']::text[])
 on conflict (id) do update set public = excluded.public,
 file_size_limit = excluded.file_size_limit,
 allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "studio_portfolio_storage_read_admin" on storage.objects;
create policy "studio_portfolio_storage_read_admin" on storage.objects
 for select to authenticated using (
 bucket_id = 'leticia-portfolio'
 and (select private.is_studio_admin()));
drop policy if exists "studio_portfolio_storage_insert_admin" on storage.objects;
create policy "studio_portfolio_storage_insert_admin" on storage.objects
 for insert to authenticated with check (
 bucket_id = 'leticia-portfolio'
 and (storage.foldername(name))[1] = 'works'
 and storage.extension(name) in ('jpg','jpeg','png','webp')
 and (select private.is_studio_admin()));
drop policy if exists "studio_portfolio_storage_delete_admin" on storage.objects;
create policy "studio_portfolio_storage_delete_admin" on storage.objects
 for delete to authenticated using (
 bucket_id = 'leticia-portfolio'
 and (select private.is_studio_admin()));
commit;
