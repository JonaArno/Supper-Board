-- Supper Board on Supabase: one table of JSON documents, readable and writable
-- only by the emails in allowed_emails. Applied to the `supper-board` project.

-- Who may use the board. Managed with SQL only; no client access.
create table public.allowed_emails (
  email text primary key check (email = lower(email))
);
alter table public.allowed_emails enable row level security;

-- True when the signed-in user's email is on the household list.
create or replace function public.is_household()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.allowed_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_household() from public, anon;
grant execute on function public.is_household() to authenticated;

-- Every board document, addressed by its path, e.g. "meals/m01" or "plan/current".
create table public.docs (
  path text primary key check (path ~ '^[A-Za-z0-9_-]+/[A-Za-z0-9_-]+$'),
  collection text generated always as (split_part(path, '/', 1)) stored,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index docs_collection_idx on public.docs (collection);
alter table public.docs enable row level security;

create policy "household reads" on public.docs
  for select to authenticated using ((select public.is_household()));
create policy "household inserts" on public.docs
  for insert to authenticated with check ((select public.is_household()));
create policy "household updates" on public.docs
  for update to authenticated using ((select public.is_household())) with check ((select public.is_household()));
create policy "household deletes" on public.docs
  for delete to authenticated using ((select public.is_household()));

revoke all on public.docs from anon;

-- Shallow-merge fields into an existing document (what the board's update() expects).
create or replace function public.merge_doc(p_path text, p_patch jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.docs
     set data = data || p_patch, updated_at = now()
   where path = p_path;
  if not found then
    raise exception 'Document does not exist: %', p_path using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.merge_doc(text, jsonb) from public, anon;
grant execute on function public.merge_doc(text, jsonb) to authenticated;

-- Live updates for everyone looking at the board.
alter publication supabase_realtime add table public.docs;
