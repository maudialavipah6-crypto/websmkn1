begin;

alter table public.profiles add column if not exists user_id text;
alter table public.profiles add column if not exists active boolean not null default true;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));
alter table public.profiles drop constraint if exists profiles_user_id_format;
alter table public.profiles add constraint profiles_user_id_format check (user_id is null or user_id ~ '^[A-Z0-9._-]{3,32}$');
create unique index if not exists profiles_user_id_unique on public.profiles (user_id) where user_id is not null;

-- Beri ID sementara pada akun lama. Admin dapat menggantinya dari dashboard.
with ranked as (
  select id, role, row_number() over (partition by role order by created_at, id) as number
  from public.profiles where user_id is null
)
update public.profiles as profile
set user_id = case
  when ranked.role = 'teacher' then 'GURU' || lpad(ranked.number::text, 3, '0')
  else 'SISWA' || lpad(ranked.number::text, 3, '0')
end
from ranked where profile.id = ranked.id;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles for select to authenticated
using (id = auth.uid() or (select private.current_role()) in ('teacher', 'admin'));

commit;
