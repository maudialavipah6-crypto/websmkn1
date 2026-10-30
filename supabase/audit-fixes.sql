-- Apply after schema.sql and id-user-migration.sql. Preserves existing data.
begin;
create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid()) and p.active
$$;

create or replace function private.grade_quiz_attempt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  question_row record;
  total_questions integer := 0;
  total_correct integer := 0;
  selected_option integer;
  quiz_is_published boolean;
begin
  if (select auth.uid()) is null
    or new.student_id <> (select auth.uid())
    or (select private.current_role()) is distinct from 'student'
  then
    raise exception 'Only the signed-in student can submit this quiz.';
  end if;

  if pg_catalog.jsonb_typeof(new.answers) is distinct from 'object' then
    raise exception 'Quiz answers must be an object keyed by question ID.';
  end if;

  select q.is_published
  into quiz_is_published
  from public.quizzes as q
  where q.id = new.quiz_id;

  if quiz_is_published is distinct from true then
    raise exception 'This quiz is not available for submission.';
  end if;

  select pg_catalog.count(*)::integer
  into total_questions
  from public.quiz_questions as question
  join public.quiz_answer_keys as answer_key
    on answer_key.question_id = question.id
  where question.quiz_id = new.quiz_id;

  if total_questions = 0
    or (select count(*) from pg_catalog.jsonb_object_keys(new.answers)) <> total_questions
  then
    raise exception 'Submit exactly one answer for each quiz question.';
  end if;

  for question_row in
    select question.id, question.choices, answer_key.correct_option
    from public.quiz_questions as question
    join public.quiz_answer_keys as answer_key
      on answer_key.question_id = question.id
    where question.quiz_id = new.quiz_id
  loop
    if not (new.answers ? question_row.id::text)
      or (new.answers ->> question_row.id::text) !~ '^[0-5]$'
    then
      raise exception 'A quiz answer is missing or invalid.';
    end if;

    selected_option := (new.answers ->> question_row.id::text)::integer;
    if selected_option >= pg_catalog.jsonb_array_length(question_row.choices) then
      raise exception 'A quiz answer is outside the available choices.';
    end if;

    if selected_option = question_row.correct_option then
      total_correct := total_correct + 1;
    end if;
  end loop;

  new.correct_count := total_correct;
  new.question_count := total_questions;
  new.score := pg_catalog.round((total_correct::numeric / total_questions) * 100)::integer;
  new.submitted_at := pg_catalog.now();
  return new;
end;
$$;


commit;
