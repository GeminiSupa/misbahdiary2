-- Client portal: RLS so authenticated portal users (clients.auth_user_id + portal_enabled)
-- can read only their own matters, history, hearings, legacy cases, and invoices.

create or replace function public.portal_linked_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.clients c
  where c.auth_user_id = auth.uid()
    and c.portal_enabled is true
  limit 1;
$$;

revoke all on function public.portal_linked_client_id() from public;
grant execute on function public.portal_linked_client_id() to authenticated;

drop policy if exists "Portal user reads own client" on public.clients;
create policy "Portal user reads own client"
  on public.clients
  for select
  using (
    auth.uid() is not null
    and auth_user_id = auth.uid()
    and portal_enabled is true
  );

drop policy if exists "Portal client selects own matters" on public.matters;
create policy "Portal client selects own matters"
  on public.matters
  for select
  using (
    public.portal_linked_client_id() is not null
    and client_id = public.portal_linked_client_id()
  );

drop policy if exists "Portal client selects case history" on public.case_histories;
create policy "Portal client selects case history"
  on public.case_histories
  for select
  using (
    public.portal_linked_client_id() is not null
    and exists (
      select 1
      from public.matters m
      where m.id = case_histories.matter_id
        and m.client_id = public.portal_linked_client_id()
    )
  );

drop policy if exists "Portal client selects own cases" on public.cases;
create policy "Portal client selects own cases"
  on public.cases
  for select
  using (
    public.portal_linked_client_id() is not null
    and client_id = public.portal_linked_client_id()
  );

drop policy if exists "Portal client selects hearings" on public.hearings;
create policy "Portal client selects hearings"
  on public.hearings
  for select
  using (
    public.portal_linked_client_id() is not null
    and (
      (
        matter_id is not null
        and exists (
          select 1
          from public.matters m
          where m.id = hearings.matter_id
            and m.client_id = public.portal_linked_client_id()
        )
      )
      or (
        case_id is not null
        and exists (
          select 1
          from public.cases c2
          where c2.id = hearings.case_id
            and c2.client_id = public.portal_linked_client_id()
        )
      )
    )
  );

drop policy if exists "Portal client selects own invoices" on public.invoices;
create policy "Portal client selects own invoices"
  on public.invoices
  for select
  using (
    public.portal_linked_client_id() is not null
    and (
      client_id = public.portal_linked_client_id()
      or (
        matter_id is not null
        and exists (
          select 1
          from public.matters m
          where m.id = invoices.matter_id
            and m.client_id = public.portal_linked_client_id()
        )
      )
    )
  );
