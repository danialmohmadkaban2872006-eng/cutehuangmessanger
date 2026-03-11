-- © Danial Mohmad — All Rights Reserved
-- Cute Huang Messenger — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New query)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- Extends auth.users. Auto-created by trigger on signup.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  app_id      text unique not null,
  display_name text not null default '',
  avatar_url  text,
  bio         text not null default '',
  online      boolean not null default false,
  last_seen   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_app_id_idx on public.profiles(app_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. APP ID GENERATOR
-- Generates unique "HU-XXXXXX" IDs. Called from the auth trigger.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.generate_app_id()
returns text
language plpgsql volatile
as $$
declare
  new_id text;
  is_taken bool;
begin
  loop
    new_id := 'HU-' || lpad((floor(random() * 900000) + 100000)::bigint::text, 6, '0');
    select exists(select 1 from public.profiles where app_id = new_id) into is_taken;
    exit when not is_taken;
  end loop;
  return new_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AUTO-CREATE PROFILE ON SIGNUP
-- Fires after insert on auth.users to create the profile row.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, app_id, display_name)
  values (
    new.id,
    public.generate_app_id(),
    coalesce(
      new.raw_user_meta_data->>'displayName',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CHATS
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.chats (
  id         uuid primary key default gen_random_uuid(),
  type       text not null default 'DIRECT' check (type in ('DIRECT', 'GROUP')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chats_updated_at_idx on public.chats(updated_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CHAT PARTICIPANTS
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.chat_participants (
  id           uuid primary key default gen_random_uuid(),
  chat_id      uuid not null references public.chats(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  unread_count integer not null default 0,
  last_read_at timestamptz not null default now(),
  joined_at    timestamptz not null default now(),
  unique(chat_id, user_id)
);

create index if not exists chat_participants_user_id_idx on public.chat_participants(user_id);
create index if not exists chat_participants_chat_id_idx on public.chat_participants(chat_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. MESSAGES
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.chats(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id),
  text        text,
  media_url   text,
  media_type  text check (media_type in ('image', 'video', 'audio', 'file') or media_type is null),
  status      text not null default 'sent' check (status in ('sent', 'delivered', 'seen')),
  reply_to_id uuid references public.messages(id) on delete set null,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists messages_chat_id_created_at_idx on public.messages(chat_id, created_at asc);
create index if not exists messages_sender_id_idx on public.messages(sender_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. HELPER RPCS
-- ─────────────────────────────────────────────────────────────────────────────

-- Atomically increment unread count for all participants except the sender
create or replace function public.increment_unread(p_chat_id uuid, p_sender_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.chat_participants
  set unread_count = unread_count + 1
  where chat_id = p_chat_id
    and user_id != p_sender_id;
$$;

-- Mark all messages in a chat as seen and reset unread count
create or replace function public.mark_chat_seen(p_chat_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.chat_participants
  set unread_count = 0, last_read_at = now()
  where chat_id = p_chat_id and user_id = p_user_id;

  update public.messages
  set status = 'seen', updated_at = now()
  where chat_id = p_chat_id
    and sender_id != p_user_id
    and status != 'seen'
    and deleted_at is null;
end;
$$;

-- Update chat updated_at when a message is inserted
create or replace function public.touch_chat_on_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists on_message_inserted on public.messages;
create trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.touch_chat_on_message();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles --
alter table public.profiles enable row level security;

create policy "Anyone authenticated can read profiles"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- chats --
alter table public.chats enable row level security;

create policy "Participants can read their chats"
  on public.chats for select
  using (
    exists (
      select 1 from public.chat_participants
      where chat_id = chats.id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create chats"
  on public.chats for insert
  with check (auth.uid() is not null);

create policy "Participants can update chat timestamp"
  on public.chats for update
  using (
    exists (
      select 1 from public.chat_participants
      where chat_id = chats.id and user_id = auth.uid()
    )
  );

-- chat_participants --
alter table public.chat_participants enable row level security;

create policy "Participants can read their participations"
  on public.chat_participants for select
  using (user_id = auth.uid() or
    exists (
      select 1 from public.chat_participants cp2
      where cp2.chat_id = chat_participants.chat_id and cp2.user_id = auth.uid()
    )
  );

create policy "Authenticated users can insert participants"
  on public.chat_participants for insert
  with check (auth.uid() is not null);

create policy "Users can update their own participation"
  on public.chat_participants for update
  using (user_id = auth.uid());

-- messages --
alter table public.messages enable row level security;

create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_participants
      where chat_id = messages.chat_id and user_id = auth.uid()
    )
  );

create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.chat_participants
      where chat_id = messages.chat_id and user_id = auth.uid()
    )
  );

create policy "Senders can soft-delete their messages"
  on public.messages for update
  using (sender_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ENABLE REALTIME
-- Run AFTER enabling Realtime for the messages table in Supabase Dashboard
-- (Database → Replication → supabase_realtime → Add tables)
-- Or run this SQL:
-- ─────────────────────────────────────────────────────────────────────────────

-- NOTE: The following ALTER PUBLICATION command requires superuser/service_role.
-- Run it once in your Supabase SQL Editor to enable Realtime on messages.
-- alter publication supabase_realtime add table public.messages;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. STORAGE BUCKETS
-- Create via Dashboard → Storage, or via the Supabase CLI/API.
-- avatars  — public bucket for profile avatars
-- chat-media — authenticated bucket for message media
-- ─────────────────────────────────────────────────────────────────────────────

-- Insert storage buckets (idempotent)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', false)
on conflict (id) do nothing;

-- Storage policies for avatars bucket
create policy "Anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for chat-media bucket
create policy "Authenticated users can read chat media"
  on storage.objects for select
  using (bucket_id = 'chat-media' and auth.uid() is not null);

create policy "Authenticated users can upload chat media"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and auth.uid() is not null);
