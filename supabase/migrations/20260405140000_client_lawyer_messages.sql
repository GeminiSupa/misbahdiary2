-- Client portal: threaded messages between a portal client and a firm lawyer profile.

create table if not exists public.client_lawyer_messages (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  lawyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  sender_auth_user_id uuid not null,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists client_lawyer_messages_thread_idx
  on public.client_lawyer_messages (client_id, lawyer_profile_id, created_at desc);

create index if not exists client_lawyer_messages_firm_idx
  on public.client_lawyer_messages (firm_id, created_at desc);

alter table public.client_lawyer_messages enable row level security;

drop policy if exists "Portal client reads own lawyer messages" on public.client_lawyer_messages;
create policy "Portal client reads own lawyer messages"
  on public.client_lawyer_messages
  for select
  using (
    public.portal_linked_client_id() is not null
    and client_id = public.portal_linked_client_id()
  );

drop policy if exists "Portal client inserts lawyer messages" on public.client_lawyer_messages;
create policy "Portal client inserts lawyer messages"
  on public.client_lawyer_messages
  for insert
  with check (
    public.portal_linked_client_id() is not null
    and client_id = public.portal_linked_client_id()
    and sender_auth_user_id = auth.uid()
    and exists (
      select 1
      from public.clients c
      where c.id = client_lawyer_messages.client_id
        and c.firm_id = client_lawyer_messages.firm_id
    )
    and exists (
      select 1
      from public.profiles p
      where p.id = lawyer_profile_id
        and p.firm_id = client_lawyer_messages.firm_id
        and p.role <> 'client'
    )
  );

drop policy if exists "Firm members read client lawyer messages" on public.client_lawyer_messages;
create policy "Firm members read client lawyer messages"
  on public.client_lawyer_messages
  for select
  using (public.is_member_of_firm(firm_id));

drop policy if exists "Firm lawyers send client portal messages" on public.client_lawyer_messages;
create policy "Firm lawyers send client portal messages"
  on public.client_lawyer_messages
  for insert
  with check (
    public.is_member_of_firm(firm_id)
    and sender_auth_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.firm_id = client_lawyer_messages.firm_id
        and p.role <> 'client'
    )
    and exists (
      select 1
      from public.clients c
      where c.id = client_id
        and c.firm_id = firm_id
    )
    and exists (
      select 1
      from public.profiles pl
      where pl.id = lawyer_profile_id
        and pl.firm_id = firm_id
        and pl.role <> 'client'
    )
  );

-- Allow portal clients to read non-client profiles in their firm (lawyer picker + message thread labels).
drop policy if exists "Portal client reads firm lawyers" on public.profiles;
create policy "Portal client reads firm lawyers"
  on public.profiles
  for select
  using (
    public.portal_linked_client_id() is not null
    and firm_id is not null
    and role <> 'client'
    and exists (
      select 1
      from public.clients c
      where c.id = public.portal_linked_client_id()
        and c.firm_id = profiles.firm_id
    )
  );
