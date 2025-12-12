-- Enhanced RLS Policies for Matters with Role-Based Access Control
-- This file contains policies that control who can see which cases based on their role
-- 
-- ACCESS CONTROL RULES:
-- 1. Firm Owner: Can see and manage ALL matters in their firm
-- 2. Principal Partner: Can see and manage ALL matters in their firm
-- 3. Associate: Can see matters they created OR are assigned to
-- 4. Of Counsel: Can see matters they created OR are assigned to
-- 5. Paralegal: Can see ONLY matters they are assigned to
-- 6. Staff: Can see ONLY matters they are assigned to
-- 7. Client: Cannot access matters directly (they see via client portal if implemented)

-- Drop existing policies
drop policy if exists "Firm members manage matters" on public.matters;
drop policy if exists "Firm members read matters" on public.matters;
drop policy if exists "Principals see all matters" on public.matters;
drop policy if exists "Associates see assigned matters" on public.matters;
drop policy if exists "Staff see assigned matters" on public.matters;
drop policy if exists "Role-based matter access" on public.matters;
drop policy if exists "Firm members create matters" on public.matters;
drop policy if exists "Firm members update matters" on public.matters;
drop policy if exists "Principals delete matters" on public.matters;

-- Helper function to check if user is principal partner or owner
create or replace function public.is_principal_or_owner(firm_id_param uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  is_owner boolean;
begin
  -- Check if user is owner
  select exists(
    select 1 from public.firms
    where id = firm_id_param
    and owner_id = auth.uid()
  ) into is_owner;
  
  if is_owner then
    return true;
  end if;
  
  -- Check user's role
  select role into user_role
  from public.profiles
  where id = auth.uid()
  and firm_id = firm_id_param;
  
  return user_role = 'principal_partner';
end;
$$;

-- Helper function to check if user can see a matter based on role
create or replace function public.can_see_matter(matter_id_param uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  firm_id_val uuid;
  is_owner boolean;
  is_assigned boolean;
  created_by_user boolean;
begin
  -- Get matter's firm_id
  select firm_id into firm_id_val
  from public.matters
  where id = matter_id_param;
  
  if firm_id_val is null then
    return false;
  end if;
  
  -- Check if user is member of firm
  if not public.is_member_of_firm(firm_id_val) then
    return false;
  end if;
  
  -- Check if user is owner
  select exists(
    select 1 from public.firms
    where id = firm_id_val
    and owner_id = auth.uid()
  ) into is_owner;
  
  if is_owner then
    return true;
  end if;
  
  -- Get user's role
  select role into user_role
  from public.profiles
  where id = auth.uid()
  and firm_id = firm_id_val;
  
  -- Principal partners can see all matters
  if user_role = 'principal_partner' then
    return true;
  end if;
  
  -- Check if user created this matter
  select exists(
    select 1 from public.matters
    where id = matter_id_param
    and created_by = auth.uid()
  ) into created_by_user;
  
  if created_by_user then
    return true;
  end if;
  
  -- Check if user is assigned to this matter
  select exists(
    select 1 from public.matters
    where id = matter_id_param
    and auth.uid() = any(assigned_attorneys)
  ) into is_assigned;
  
  if is_assigned then
    return true;
  end if;
  
  -- Associates and of_counsel can see matters they created or are assigned to
  if user_role in ('associate', 'of_counsel') then
    return created_by_user or is_assigned;
  end if;
  
  -- Paralegals and staff can only see assigned matters
  if user_role in ('paralegal', 'staff') then
    return is_assigned;
  end if;
  
  -- Clients can only see their own matters (via client_id)
  if user_role = 'client' then
    -- This would require a client_id field or relationship
    -- For now, return false as clients shouldn't access matters directly
    return false;
  end if;
  
  return false;
end;
$$;

-- SELECT policy: Role-based read access
create policy "Role-based matter access"
  on public.matters
  for select
  using (
    -- Must be member of firm
    public.is_member_of_firm(firm_id)
    and (
      -- Owners and principal partners see all
      public.is_principal_or_owner(firm_id)
      or
      -- User created the matter
      created_by = auth.uid()
      or
      -- User is assigned to the matter
      auth.uid() = any(assigned_attorneys)
      or
      -- Associates and of_counsel can see matters they created or are assigned
      (
        exists (
          select 1 from public.profiles
          where id = auth.uid()
          and firm_id = matters.firm_id
          and role in ('associate', 'of_counsel')
        )
        and (
          created_by = auth.uid()
          or auth.uid() = any(assigned_attorneys)
        )
      )
      or
      -- Paralegals and staff can only see assigned matters
      (
        exists (
          select 1 from public.profiles
          where id = auth.uid()
          and firm_id = matters.firm_id
          and role in ('paralegal', 'staff')
        )
        and auth.uid() = any(assigned_attorneys)
      )
    )
  );

-- INSERT policy: Only firm members can create matters
create policy "Firm members create matters"
  on public.matters
  for insert
  with check (
    public.is_member_of_firm(firm_id)
    and (
      -- Owners and principals can always create
      public.is_principal_or_owner(firm_id)
      or
      -- Associates and of_counsel can create
      exists (
        select 1 from public.profiles
        where id = auth.uid()
        and firm_id = matters.firm_id
        and role in ('associate', 'of_counsel', 'principal_partner')
      )
    )
  );

-- UPDATE policy: Only firm members can update matters
create policy "Firm members update matters"
  on public.matters
  for update
  using (
    public.is_member_of_firm(firm_id)
    and (
      -- Must be able to see the matter (using same logic as SELECT)
      public.is_principal_or_owner(firm_id)
      or created_by = auth.uid()
      or auth.uid() = any(assigned_attorneys)
      or (
        exists (
          select 1 from public.profiles
          where id = auth.uid()
          and firm_id = matters.firm_id
          and role in ('associate', 'of_counsel')
        )
        and (
          created_by = auth.uid()
          or auth.uid() = any(assigned_attorneys)
        )
      )
    )
  )
  with check (
    public.is_member_of_firm(firm_id)
  );

-- DELETE policy: Only owners and principals can delete matters
create policy "Principals delete matters"
  on public.matters
  for delete
  using (
    public.is_member_of_firm(firm_id)
    and public.is_principal_or_owner(firm_id)
  );

