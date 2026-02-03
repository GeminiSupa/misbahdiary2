-- Create dashboard_preferences table for storing user dashboard layouts
create table if not exists public.dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  widget_id text not null,
  widget_type text not null, -- 'kpi', 'chart', 'agenda', 'recent_activity', etc.
  position integer not null, -- Order/position in the dashboard
  size text not null default 'medium', -- 'small', 'medium', 'large'
  color_scheme text, -- Custom color scheme for the widget
  typography text, -- Custom typography settings (JSON)
  is_visible boolean not null default true,
  custom_config jsonb, -- Additional widget-specific configuration
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, widget_id)
);

-- Create index for faster queries
create index if not exists idx_dashboard_preferences_user_id on public.dashboard_preferences(user_id);
create index if not exists idx_dashboard_preferences_firm_id on public.dashboard_preferences(firm_id);
create index if not exists idx_dashboard_preferences_position on public.dashboard_preferences(user_id, position);

-- Enable RLS
alter table public.dashboard_preferences enable row level security;

-- Policy: Users can only view their own dashboard preferences
create policy "Users can view their own dashboard preferences"
  on public.dashboard_preferences
  for select
  using (user_id = auth.uid());

-- Policy: Users can insert their own dashboard preferences
create policy "Users can insert their own dashboard preferences"
  on public.dashboard_preferences
  for insert
  with check (user_id = auth.uid());

-- Policy: Users can update their own dashboard preferences
create policy "Users can update their own dashboard preferences"
  on public.dashboard_preferences
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Users can delete their own dashboard preferences
create policy "Users can delete their own dashboard preferences"
  on public.dashboard_preferences
  for delete
  using (user_id = auth.uid());

-- Function to update updated_at timestamp
create or replace function update_dashboard_preferences_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at
drop trigger if exists update_dashboard_preferences_timestamp on public.dashboard_preferences;
create trigger update_dashboard_preferences_timestamp
  before update on public.dashboard_preferences
  for each row
  execute function update_dashboard_preferences_updated_at();
