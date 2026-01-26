-- Add created_by field to profiles table to track who created each user
alter table public.profiles
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- Create index for better query performance
create index if not exists profiles_created_by_idx on public.profiles(created_by);

-- Add comment
comment on column public.profiles.created_by is 'References the profile.id of the user who created this profile. Null for existing records and self-registered users.';
