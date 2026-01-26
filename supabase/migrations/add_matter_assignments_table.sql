-- Create matter_assignments table to track team member assignments to matters
create table if not exists public.matter_assignments (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  notes text,
  is_active boolean not null default true,
  
  unique(matter_id, user_id)
);

-- Create indexes for better query performance
create index if not exists matter_assignments_matter_id_idx on public.matter_assignments(matter_id);
create index if not exists matter_assignments_user_id_idx on public.matter_assignments(user_id);
create index if not exists matter_assignments_assigned_by_idx on public.matter_assignments(assigned_by);
create index if not exists matter_assignments_is_active_idx on public.matter_assignments(is_active) where is_active = true;

-- Add comment
comment on table public.matter_assignments is 'Tracks team member assignments to matters with metadata (who assigned, when, notes)';

-- Migrate existing assigned_attorneys array data to matter_assignments table
-- This creates assignment records for all existing assignments
insert into public.matter_assignments (matter_id, user_id, assigned_by, assigned_at, is_active)
select 
  m.id as matter_id,
  unnest(m.assigned_attorneys::uuid[]) as user_id,
  m.created_by as assigned_by, -- Use matter creator as default assigner
  m.created_at as assigned_at, -- Use matter creation date as default assignment date
  true as is_active
from public.matters m
where m.assigned_attorneys is not null 
  and array_length(m.assigned_attorneys::uuid[], 1) > 0
on conflict (matter_id, user_id) do nothing;

-- Enable Row Level Security
alter table public.matter_assignments enable row level security;

-- RLS Policies for matter_assignments
-- Firm members can view assignments for matters in their firm
drop policy if exists "Firm members can view matter assignments" on public.matter_assignments;
create policy "Firm members can view matter assignments"
  on public.matter_assignments
  for select
  using (
    exists (
      select 1
      from public.matters m
      where m.id = matter_assignments.matter_id
        and public.is_member_of_firm(m.firm_id)
    )
  );

-- Firm owners and principal partners can manage assignments
drop policy if exists "Firm owners and partners can manage assignments" on public.matter_assignments;
create policy "Firm owners and partners can manage assignments"
  on public.matter_assignments
  for all
  using (
    exists (
      select 1
      from public.matters m
      join public.profiles p on p.firm_id = m.firm_id
      where m.id = matter_assignments.matter_id
        and p.id = auth.uid()
        and (
          exists (
            select 1
            from public.firms f
            where f.id = m.firm_id
              and f.owner_id = auth.uid()
          )
          or p.role = 'principal_partner'
        )
    )
  )
  with check (
    exists (
      select 1
      from public.matters m
      join public.profiles p on p.firm_id = m.firm_id
      where m.id = matter_assignments.matter_id
        and p.id = auth.uid()
        and (
          exists (
            select 1
            from public.firms f
            where f.id = m.firm_id
              and f.owner_id = auth.uid()
          )
          or p.role = 'principal_partner'
        )
    )
  );
