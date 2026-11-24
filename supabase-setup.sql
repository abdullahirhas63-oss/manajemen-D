-- Jalankan di Supabase > SQL Editor. Ganti GANTI_EMAIL_ADMIN2 dengan email akun admin 2 (sama dengan adminEmail di db-config.js).
create table if not exists public.kv(key text primary key, value jsonb not null, updated_at timestamptz not null default now(), updated_by text);
create table if not exists public.audit_log(id bigserial primary key, at timestamptz not null default now(), actor text, area text, action text, detail text);
alter table public.kv enable row level security;
alter table public.audit_log enable row level security;
create or replace function public.is_admin2() returns boolean language sql stable as $$ select coalesce(auth.jwt()->>'email','') = 'GANTI_EMAIL_ADMIN2' $$;
create policy kv_read on public.kv for select to anon, authenticated using (true);
create policy kv_ins on public.kv for insert to authenticated with check (public.is_admin2());
create policy kv_upd on public.kv for update to authenticated using (public.is_admin2()) with check (public.is_admin2());
create policy kv_del on public.kv for delete to authenticated using (public.is_admin2());
-- Log audit: hanya bisa ditambah & dibaca admin 2; tidak ada policy update/delete, jadi tidak bisa diubah dari aplikasi.
create policy aud_ins on public.audit_log for insert to authenticated with check (public.is_admin2());
create policy aud_sel on public.audit_log for select to authenticated using (public.is_admin2());
create or replace function public.touch() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger kv_touch before update on public.kv for each row execute function public.touch();
