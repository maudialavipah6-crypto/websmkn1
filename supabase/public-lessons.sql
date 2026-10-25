-- Jalankan satu kali di SQL Editor untuk proyek yang sudah menerapkan schema.sql.
-- Hanya materi terbit dan lampirannya yang dapat dibaca pengunjung tanpa akun.
begin;

grant select on public.lessons, public.lesson_attachments to anon;

drop policy if exists "Visitors can read published lessons" on public.lessons;
create policy "Visitors can read published lessons"
  on public.lessons for select to anon using (is_published);

drop policy if exists "Visitors can read published lesson attachments" on public.lesson_attachments;
create policy "Visitors can read published lesson attachments"
  on public.lesson_attachments for select to anon
  using (exists (
    select 1 from public.lessons as lesson
    where lesson.id = lesson_id and lesson.is_published
  ));

drop policy if exists "Visitors read assets for published TKJ lessons" on storage.objects;
create policy "Visitors read assets for published TKJ lessons"
  on storage.objects for select to anon
  using (
    bucket_id = 'tkj-course-assets'
    and exists (
      select 1 from public.lesson_attachments as attachment
      join public.lessons as lesson on lesson.id = attachment.lesson_id
      where attachment.storage_path = name and lesson.is_published
    )
  );

commit;
