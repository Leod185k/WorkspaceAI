create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add ownership to an existing conversations table. Old rows stay unassigned and
-- are hidden by RLS until an administrator explicitly assigns them to a user.
alter table public.conversations
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 40000),
  provider text,
  model text,
  raw_provider_output text check (raw_provider_output is null or char_length(raw_provider_output) <= 40000),
  collapsed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_at_idx
  on public.conversations (user_id, updated_at desc);
create index if not exists messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at);

create or replace function public.set_conversation_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_conversation_updated_at();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on table public.conversations, public.messages from anon, authenticated;
grant select, insert, update, delete on table public.conversations, public.messages to authenticated;

drop policy if exists "Allow app access to conversations" on public.conversations;
drop policy if exists "Users read their conversations" on public.conversations;
create policy "Users read their conversations" on public.conversations
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create their conversations" on public.conversations;
create policy "Users create their conversations" on public.conversations
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their conversations" on public.conversations;
create policy "Users update their conversations" on public.conversations
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete their conversations" on public.conversations;
create policy "Users delete their conversations" on public.conversations
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Allow app access to messages" on public.messages;
drop policy if exists "Users read their messages" on public.messages;
create policy "Users read their messages" on public.messages
  for select to authenticated using (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid()))
  );
drop policy if exists "Users create their messages" on public.messages;
create policy "Users create their messages" on public.messages
  for insert to authenticated with check (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid()))
  );
drop policy if exists "Users update their messages" on public.messages;
create policy "Users update their messages" on public.messages
  for update to authenticated using (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid()))
  );
drop policy if exists "Users delete their messages" on public.messages;
create policy "Users delete their messages" on public.messages
  for delete to authenticated using (
    exists (select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid()))
  );

create table if not exists public.chat_rate_limits (
  scope text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (scope, window_start)
);
alter table public.chat_rate_limits enable row level security;
revoke all on table public.chat_rate_limits from anon, authenticated;

drop function if exists public.consume_chat_rate_limit(text, integer, integer);
create or replace function public.consume_chat_rate_limit(p_window_seconds integer)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_user_scope text;
  v_user_limit integer;
  v_global_limit integer;
  v_user_count integer;
  v_global_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication is required' using errcode = '42501';
  end if;
  if p_window_seconds = 60 then
    v_user_limit := 4;
    v_global_limit := 20;
  elsif p_window_seconds = 86400 then
    v_user_limit := 30;
    v_global_limit := 120;
  else
    raise exception 'unsupported rate-limit window';
  end if;

  v_user_scope := auth.uid()::text;
  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.chat_rate_limits as current_limit (scope, window_start, request_count)
  values (v_user_scope, v_window_start, 1)
  on conflict (scope, window_start) do update
    set request_count = current_limit.request_count + 1
  returning request_count into v_user_count;

  insert into public.chat_rate_limits as current_limit (scope, window_start, request_count)
  values ('global', v_window_start, 1)
  on conflict (scope, window_start) do update
    set request_count = current_limit.request_count + 1
  returning request_count into v_global_count;

  if p_window_seconds >= 86400 then
    delete from public.chat_rate_limits
    where window_start < clock_timestamp() - interval '2 days';
  end if;

  return query select
    v_user_count <= v_user_limit and v_global_count <= v_global_limit,
    greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - clock_timestamp())))::integer);
end;
$$;

revoke all on function public.consume_chat_rate_limit(integer) from public, anon;
grant execute on function public.consume_chat_rate_limit(integer) to authenticated;
