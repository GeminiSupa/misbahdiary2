-- Create audit_logs table for tracking critical actions
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references public.firms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null, -- 'user_created', 'client_deleted', 'matter_deleted', 'invoice_deleted', 'password_changed', etc.
  entity_type text not null, -- 'user', 'client', 'matter', 'invoice', 'payment', etc.
  entity_id uuid, -- ID of the affected entity
  details jsonb, -- Additional context (e.g., old values, new values, reason)
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Create index for faster queries
create index if not exists idx_audit_logs_firm_id on public.audit_logs(firm_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_entity_type on public.audit_logs(entity_type);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policy: Users can only see audit logs from their own firm
create policy "Users can view audit logs from their firm"
  on public.audit_logs
  for select
  using (
    firm_id in (
      select firm_id from public.profiles where id = auth.uid()
    )
  );

-- Policy: Only service role can insert audit logs (via server actions)
-- This is handled by server-side code using service role client
