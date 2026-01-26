-- Fix user creation trigger to properly handle role and firm_id from user_metadata
-- This ensures the trigger doesn't override values set by the application

-- Update the handle_new_user function to better handle metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert profile with role from metadata, but don't set firm_id or created_by
  -- These should be set by the application code using admin client
  insert into public.profiles (id, role, full_name, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update
    set role = coalesce(excluded.role, profiles.role),
        full_name = coalesce(excluded.full_name, profiles.full_name),
        updated_at = timezone('utc', now());

  -- Create notification preferences
  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;
  
  return new;
end;
$$;

-- The trigger is already created, so we don't need to recreate it
-- Just ensure it's using the updated function
