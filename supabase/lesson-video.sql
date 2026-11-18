-- Run in Supabase SQL Editor before enabling the video field in production.
alter table public.lessons add column if not exists video_url text;
