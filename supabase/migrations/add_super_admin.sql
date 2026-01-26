-- Add super admin column to profiles table
-- This allows platform administrators to manage multiple firms

alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

-- Create index for faster lookups
create index if not exists profiles_is_super_admin_idx 
  on public.profiles(is_super_admin) 
  where is_super_admin = true;

-- Add comment
comment on column public.profiles.is_super_admin is 'Platform administrator who can create and manage multiple firms';
