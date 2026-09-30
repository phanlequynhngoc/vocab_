-- Vocab SRS V1 database schema
-- Run this entire file once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.vocabularies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  word text not null check (char_length(word) between 1 and 200),
  meaning text not null,
  example text,
  phonetic text,
  part_of_speech text,
  note text,
  state text not null default 'new' check (state in ('new', 'learning', 'review')),
  difficulty double precision not null default 5,
  stability double precision not null default 0,
  last_review timestamptz,
  next_review timestamptz,
  review_count integer not null default 0 check (review_count >= 0),
  lapse_count integer not null default 0 check (lapse_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabularies(id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),
  reviewed_at timestamptz not null default now(),
  previous_interval double precision not null default 0,
  new_interval double precision not null default 0
);

create index if not exists folders_user_idx on public.folders(user_id);
create index if not exists vocab_user_folder_idx on public.vocabularies(user_id, folder_id);
create index if not exists vocab_next_review_idx on public.vocabularies(user_id, next_review);
create index if not exists review_history_user_vocab_idx on public.review_history(user_id, vocabulary_id, reviewed_at desc);
create unique index if not exists vocab_unique_word_per_folder on public.vocabularies(folder_id, lower(word));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vocabularies_set_updated_at on public.vocabularies;
create trigger vocabularies_set_updated_at
before update on public.vocabularies
for each row execute function public.set_updated_at();

alter table public.folders enable row level security;
alter table public.vocabularies enable row level security;
alter table public.review_history enable row level security;

drop policy if exists "folders_select_own" on public.folders;
create policy "folders_select_own" on public.folders for select using (auth.uid() = user_id);
drop policy if exists "folders_insert_own" on public.folders;
create policy "folders_insert_own" on public.folders for insert with check (auth.uid() = user_id);
drop policy if exists "folders_update_own" on public.folders;
create policy "folders_update_own" on public.folders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "folders_delete_own" on public.folders;
create policy "folders_delete_own" on public.folders for delete using (auth.uid() = user_id);

drop policy if exists "vocab_select_own" on public.vocabularies;
create policy "vocab_select_own" on public.vocabularies for select using (auth.uid() = user_id);
drop policy if exists "vocab_insert_own" on public.vocabularies;
create policy "vocab_insert_own" on public.vocabularies for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid()
  )
);
drop policy if exists "vocab_update_own" on public.vocabularies;
create policy "vocab_update_own" on public.vocabularies for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id and exists (
    select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid()
  )
);
drop policy if exists "vocab_delete_own" on public.vocabularies;
create policy "vocab_delete_own" on public.vocabularies for delete using (auth.uid() = user_id);

drop policy if exists "history_select_own" on public.review_history;
create policy "history_select_own" on public.review_history for select using (auth.uid() = user_id);
drop policy if exists "history_insert_own" on public.review_history;
create policy "history_insert_own" on public.review_history for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.vocabularies v where v.id = vocabulary_id and v.user_id = auth.uid()
  )
);

-- One atomic function per review: update SRS state + append history in the same transaction.
create or replace function public.review_vocabulary(
  p_vocabulary_id uuid,
  p_rating smallint,
  p_next_review timestamptz,
  p_state text,
  p_difficulty double precision,
  p_stability double precision,
  p_previous_interval double precision,
  p_new_interval double precision
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if p_rating < 1 or p_rating > 4 then
    raise exception 'rating must be between 1 and 4';
  end if;

  update public.vocabularies
  set
    state = p_state,
    difficulty = p_difficulty,
    stability = p_stability,
    last_review = now(),
    next_review = p_next_review,
    review_count = review_count + 1,
    lapse_count = lapse_count + case when p_rating = 1 then 1 else 0 end
  where id = p_vocabulary_id and user_id = auth.uid()
  returning id into updated_id;

  if updated_id is null then
    raise exception 'Vocabulary not found or access denied';
  end if;

  insert into public.review_history (
    user_id, vocabulary_id, rating, previous_interval, new_interval
  ) values (
    auth.uid(), p_vocabulary_id, p_rating, p_previous_interval, p_new_interval
  );
end;
$$;

grant execute on function public.review_vocabulary(uuid, smallint, timestamptz, text, double precision, double precision, double precision, double precision) to authenticated;
