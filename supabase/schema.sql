create extension if not exists "pgcrypto";

-- Ensure trigger function exists for updated_at timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Domain enums for consistent status handling (idempotent)
do $$
begin
  create type public.case_status as enum ('pending', 'active', 'closed', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.hearing_status as enum ('scheduled', 'adjourned', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.client_type as enum ('individual', 'organization');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.client_representation as enum ('self', 'representative');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.representative_capacity as enum ('third_party', 'corporate', 'government_dept');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.matter_type as enum ('advisory', 'litigation', 'mediation');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.matter_case_type as enum ('civil', 'criminal', 'corporate');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.matter_status as enum ('fresh diary', 'pending', 'execution', 'revision', 'review', 'appeal');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.matter_party_type as enum ('individual', 'organization', 'state');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.calendar_event_type as enum ('hearing', 'follow_up', 'execution', 'appeal', 'deadline');
exception
  when duplicate_object then null;
end
$$;

-- Firms represent tenant boundary
create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  timezone text default 'Asia/Karachi',
  locale text default 'en-PK',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_timestamp_firms on public.firms;
create trigger set_timestamp_firms
before update on public.firms
for each row
execute procedure public.set_updated_at();

alter table public.firms
  add column if not exists owner_id uuid;

-- Profiles extend Supabase Auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  firm_id uuid references public.firms(id) on delete set null,
  role text check (role in ('principal_partner', 'associate', 'paralegal', 'of_counsel', 'client', 'staff')),
  full_name text,
  phone text,
  language_preference text default 'en',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_timestamp_profiles on public.profiles;
create trigger set_timestamp_profiles
before update on public.profiles
for each row
execute procedure public.set_updated_at();

-- Automatically create a profile record when a new auth user registers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do nothing;

  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper function to check firm membership for the current authenticated user
create or replace function public.is_member_of_firm(target_firm uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.firm_id = target_firm
  );
$$;

create table if not exists public.matter_serial_counters (
  firm_id uuid not null references public.firms(id) on delete cascade,
  matter_type public.matter_type not null,
  last_sequence integer not null default 0,
  primary key (firm_id, matter_type)
);

create or replace function public.generate_matter_serial(p_firm_id uuid, p_matter_type public.matter_type)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
  prefix text;
begin
  if p_matter_type = 'advisory' then
    prefix := 'ADV';
  elsif p_matter_type = 'litigation' then
    prefix := 'LIT';
  elsif p_matter_type = 'mediation' then
    prefix := 'MED';
  else
    prefix := 'MAT';
  end if;

  insert into public.matter_serial_counters as counters (firm_id, matter_type, last_sequence)
  values (p_firm_id, p_matter_type, 1)
  on conflict (firm_id, matter_type) do update
    set last_sequence = counters.last_sequence + 1
    returning counters.last_sequence into next_number;

  return format('%s-%04s', prefix, next_number::text);
end;
$$;

create or replace function public.matters_before_insert_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.serial_number is null or new.serial_number = '' then
    new.serial_number := public.generate_matter_serial(new.firm_id, new.matter_type);
  end if;
  if new.created_at is null then
    new.created_at := timezone('utc', now());
  end if;
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

-- Clients table (CRM)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  type public.client_type not null default 'individual',
  name text,
  father_name text,
  full_name text not null,
  organization_name text,
  email text,
  phone text,
  cnic text,
  address text,
  representation public.client_representation not null default 'self',
  representative_details jsonb,
  city text,
  province text,
  country text default 'Pakistan',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_timestamp_clients on public.clients;
create trigger set_timestamp_clients
before update on public.clients
for each row
execute procedure public.set_updated_at();

-- Ensure all columns exist (for existing tables that were created before these columns were added)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'type') then
    alter table public.clients add column type public.client_type default 'individual';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'name') then
    alter table public.clients add column name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'father_name') then
    alter table public.clients add column father_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'full_name') then
    alter table public.clients add column full_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'organization_name') then
    alter table public.clients add column organization_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'email') then
    alter table public.clients add column email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'phone') then
    alter table public.clients add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'cnic') then
    alter table public.clients add column cnic text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'address') then
    alter table public.clients add column address text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'representation') then
    alter table public.clients add column representation public.client_representation default 'self';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'representative_details') then
    alter table public.clients add column representative_details jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'city') then
    alter table public.clients add column city text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'province') then
    alter table public.clients add column province text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'country') then
    alter table public.clients add column country text default 'Pakistan';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'notes') then
    alter table public.clients add column notes text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'created_by') then
    alter table public.clients add column created_by uuid references public.profiles(id);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'created_at') then
    alter table public.clients add column created_at timestamptz default timezone('utc', now());
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'updated_at') then
    alter table public.clients add column updated_at timestamptz default timezone('utc', now());
  end if;
end
$$;

alter table public.clients
  drop constraint if exists clients_cnic_unique;

drop index if exists clients_cnic_unique_idx;

create unique index if not exists clients_cnic_unique_idx
  on public.clients (lower(cnic))
  where cnic is not null and length(trim(cnic)) > 0;

-- Matters (core case intake)
create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  serial_number text not null,
  matter_type public.matter_type not null,
  matter_status public.matter_status not null default 'fresh diary',
  case_number text,
  court_name text,
  district text,
  case_file_date date,
  case_type public.matter_case_type,
  client_brief text,
  against_parties jsonb,
  evidence_provided text[],
  documents_provided text[],
  pending_documents text[],
  assigned_attorneys uuid[] default '{}'::uuid[],
  metadata jsonb default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (firm_id, serial_number)
);

drop trigger if exists set_timestamp_matters on public.matters;
create trigger set_timestamp_matters
before update on public.matters
for each row execute procedure public.set_updated_at();

drop trigger if exists matters_before_insert on public.matters;
create trigger matters_before_insert
before insert on public.matters
for each row execute procedure public.matters_before_insert_trigger();

create index if not exists matters_firm_serial_idx on public.matters (firm_id, serial_number);
create index if not exists matters_client_idx on public.matters (client_id);
create index if not exists matters_attorneys_gin on public.matters using gin (assigned_attorneys);
create index if not exists matters_district_idx on public.matters (district);

-- Case history log
create table if not exists public.case_histories (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  matter_id uuid not null references public.matters(id) on delete cascade,
  date date not null,
  details text not null,
  hearing_date date,
  case_number text,
  court_name text,
  stage text,
  next_hearing_reason text,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists case_histories_matter_id_idx on public.case_histories (matter_id, date desc);

-- Matter finances
create table if not exists public.finances (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  matter_id uuid not null references public.matters(id) on delete cascade,
  fee_total numeric(14,2) not null default 0,
  fee_paid numeric(14,2) not null default 0,
  fee_pending numeric(14,2) generated always as (fee_total - fee_paid) stored,
  payment_history jsonb default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_timestamp_finances on public.finances;
create trigger set_timestamp_finances
before update on public.finances
for each row execute procedure public.set_updated_at();

create index if not exists finances_matter_idx on public.finances (matter_id);

-- Staff directory
create table if not exists public.staff (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  role text not null check (role in ('junior', 'senior', 'staff')),
  assigned_courts text[],
  assigned_districts text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_timestamp_staff on public.staff;
create trigger set_timestamp_staff
before update on public.staff
for each row execute procedure public.set_updated_at();

create index if not exists staff_firm_role_idx on public.staff (firm_id, role);

-- Calendar events for matters
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  matter_id uuid references public.matters(id) on delete set null,
  event_type public.calendar_event_type not null,
  event_date date not null,
  description text,
  notified_users uuid[] default '{}'::uuid[],
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_timestamp_calendar_events on public.calendar_events;
create trigger set_timestamp_calendar_events
before update on public.calendar_events
for each row execute procedure public.set_updated_at();

create index if not exists calendar_events_matter_idx on public.calendar_events (matter_id, event_date);
create index if not exists calendar_events_type_idx on public.calendar_events (firm_id, event_type, event_date);

-- Cases
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  lead_counsel_id uuid references public.profiles(id) on delete set null,
  case_number text not null,
  title text not null,
  case_type text,
  status public.case_status not null default 'pending',
  description text,
  court_name text,
  jurisdiction text,
  filing_date date,
  closing_date date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (firm_id, case_number)
);

drop trigger if exists set_timestamp_cases on public.cases;
create trigger set_timestamp_cases
before update on public.cases
for each row
execute procedure public.set_updated_at();

-- Hearings tied to cases
create table if not exists public.hearings (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  matter_id uuid references public.matters(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer check (duration_minutes >= 0),
  location text,
  judge text,
  status public.hearing_status not null default 'scheduled',
  reminder_channel text[],
  reminder_sent_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_timestamp_hearings on public.hearings;
create trigger set_timestamp_hearings
before update on public.hearings
for each row
execute procedure public.set_updated_at();

alter table public.hearings
  add column if not exists matter_id uuid references public.matters(id) on delete cascade;

alter table public.hearings
  alter column case_id drop not null;

create index if not exists hearings_matter_id_idx on public.hearings (matter_id, scheduled_at);

alter table public.calendar_events
  add column if not exists hearing_id uuid references public.hearings(id) on delete cascade;

create unique index if not exists calendar_events_hearing_id_key
  on public.calendar_events(hearing_id)
  where hearing_id is not null;

-- Documents stored in Supabase Storage
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  matter_id uuid references public.matters(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  version integer not null default 1,
  size_bytes bigint check (size_bytes >= 0),
  tags text[],
  metadata jsonb default '{}'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_timestamp_documents on public.documents;
create trigger set_timestamp_documents
before update on public.documents
for each row
execute procedure public.set_updated_at();

alter table public.documents
  add column if not exists matter_id uuid references public.matters(id) on delete set null;

create index if not exists documents_matter_id_idx on public.documents (matter_id);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  case_id uuid references public.cases(id) on delete set null,
  matter_id uuid references public.matters(id) on delete set null,
  invoice_number text not null,
  status public.invoice_status not null default 'draft',
  billing_currency text not null default 'PKR',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  paid_at timestamptz,
  reminder_sent_at timestamptz,
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (firm_id, invoice_number)
);

drop trigger if exists set_timestamp_invoices on public.invoices;
create trigger set_timestamp_invoices
before update on public.invoices
for each row
execute procedure public.set_updated_at();

alter table public.invoices
  add column if not exists amount_paid numeric(14,2) not null default 0;

alter table public.invoices
  add column if not exists paid_at timestamptz;

alter table public.invoices
  add column if not exists matter_id uuid references public.matters(id) on delete set null;

create index if not exists invoices_matter_id_idx on public.invoices (matter_id, status);

-- Time tracking
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  matter_id uuid references public.matters(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer check (duration_minutes >= 0),
  billable boolean not null default true,
  billing_rate numeric(12,2) check (billing_rate is null or billing_rate >= 0),
  amount numeric(12,2),
  description text,
  invoice_id uuid references public.invoices(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint billable_amount_check check (
    (billable is false and amount is null)
    or billable is true
  )
);

drop trigger if exists set_timestamp_time_entries on public.time_entries;
create trigger set_timestamp_time_entries
before update on public.time_entries
for each row
execute procedure public.set_updated_at();

alter table public.time_entries
  add column if not exists matter_id uuid references public.matters(id) on delete set null;

create index if not exists time_entries_matter_id_idx on public.time_entries (matter_id, user_id);

-- Firm invitations
create table if not exists public.firm_invitations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  email text not null,
  role text not null,
  token text not null,
  status text not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists firm_invitations_token_key on public.firm_invitations(token);
create index if not exists firm_invitations_firm_id_status_idx on public.firm_invitations(firm_id, status);

alter table public.time_entries
  drop constraint if exists time_entries_amount_default;

alter table public.time_entries
  add constraint time_entries_amount_default
  check (
    (amount is null and billing_rate is null)
    or amount >= 0
  );

-- Indexes for performance
create index if not exists cases_firm_id_status_idx on public.cases (firm_id, status);
create index if not exists cases_client_id_idx on public.cases (client_id);
create index if not exists hearings_case_id_scheduled_at_idx on public.hearings (case_id, scheduled_at);
create index if not exists documents_case_id_idx on public.documents (case_id);
create index if not exists documents_tags_idx on public.documents using gin (tags);
create index if not exists time_entries_case_id_user_id_idx on public.time_entries (case_id, user_id);
create index if not exists invoices_client_id_status_idx on public.invoices (client_id, status);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  link text,
  related_entity text,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_firm_id_user_id_idx on public.notifications (firm_id, user_id);
create index if not exists notifications_read_at_idx on public.notifications (read_at);

-- Notification preferences
create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  hearing_reminders boolean not null default true,
  invoice_reminders boolean not null default true,
  announcement_updates boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Enable Row Level Security
alter table public.firms enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.cases enable row level security;
alter table public.hearings enable row level security;
alter table public.documents enable row level security;
alter table public.time_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.firm_invitations enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.matter_serial_counters enable row level security;
alter table public.matters enable row level security;
alter table public.case_histories enable row level security;
alter table public.finances enable row level security;
alter table public.staff enable row level security;
alter table public.calendar_events enable row level security;

drop trigger if exists set_timestamp_notification_preferences on public.notification_preferences;
create trigger set_timestamp_notification_preferences
before update on public.notification_preferences
for each row execute procedure public.set_updated_at();


-- RLS Policies
-- Firms: users can only view/update their own firm
drop policy if exists "Firm members can view firm" on public.firms;
create policy "Firm members can view firm"
  on public.firms
  for select
  using (
    public.is_member_of_firm(id)
    or owner_id = auth.uid()
  );

drop policy if exists "Firm members can update firm" on public.firms;
create policy "Firm members can update firm"
  on public.firms
  for update
  using (
    public.is_member_of_firm(id)
    or owner_id = auth.uid()
  )
  with check (
    public.is_member_of_firm(id)
    or owner_id = auth.uid()
  );

drop policy if exists "Authenticated users can create firm" on public.firms;
create policy "Authenticated users can create firm"
  on public.firms
  for insert
  with check (
    auth.uid() is not null
    and owner_id = auth.uid()
  );

-- Profiles
drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Firm members can view teammates" on public.profiles;
create policy "Firm members can view teammates"
  on public.profiles
  for select
  using (
    firm_id is not null
    and public.is_member_of_firm(firm_id)
  );

drop policy if exists "Users manage their profile" on public.profiles;
create policy "Users manage their profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Clients
drop policy if exists "Firm members manage clients" on public.clients;
create policy "Firm members manage clients"
  on public.clients
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Matter serial counters (internal)
drop policy if exists "Firm members view matter counters" on public.matter_serial_counters;
create policy "Firm members view matter counters"
  on public.matter_serial_counters
  for select
  using (public.is_member_of_firm(firm_id));

drop policy if exists "Firm members increment matter counters" on public.matter_serial_counters;
create policy "Firm members increment matter counters"
  on public.matter_serial_counters
  for insert
  with check (public.is_member_of_firm(firm_id));

drop policy if exists "Firm members update matter counters" on public.matter_serial_counters;
create policy "Firm members update matter counters"
  on public.matter_serial_counters
  for update
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Matters
drop policy if exists "Firm members manage matters" on public.matters;
create policy "Firm members manage matters"
  on public.matters
  for all
  using (
    public.is_member_of_firm(firm_id)
    or (
      auth.uid() is not null
      and assigned_attorneys is not null
      and auth.uid() = any(assigned_attorneys)
    )
  )
  with check (
    public.is_member_of_firm(firm_id)
    or (
      auth.uid() is not null
      and assigned_attorneys is not null
      and auth.uid() = any(assigned_attorneys)
    )
  );

-- Case histories
drop policy if exists "Firm members manage case histories" on public.case_histories;
create policy "Firm members manage case histories"
  on public.case_histories
  for all
  using (
    public.is_member_of_firm(firm_id)
    or (
      auth.uid() is not null
      and exists (
        select 1
        from public.matters m
        where m.id = case_histories.matter_id
          and (
            public.is_member_of_firm(m.firm_id)
            or (m.assigned_attorneys is not null and auth.uid() = any(m.assigned_attorneys))
          )
      )
    )
  )
  with check (
    public.is_member_of_firm(firm_id)
  );

-- Finances
drop policy if exists "Firm members manage finances" on public.finances;
create policy "Firm members manage finances"
  on public.finances
  for all
  using (
    public.is_member_of_firm(firm_id)
    or (
      auth.uid() is not null
      and exists (
        select 1
        from public.matters m
        where m.id = finances.matter_id
          and (
            public.is_member_of_firm(m.firm_id)
            or (m.assigned_attorneys is not null and auth.uid() = any(m.assigned_attorneys))
          )
      )
    )
  )
  with check (public.is_member_of_firm(firm_id));

-- Staff
drop policy if exists "Firm members manage staff" on public.staff;
create policy "Firm members manage staff"
  on public.staff
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Calendar events
drop policy if exists "Firm members manage calendar events" on public.calendar_events;
create policy "Firm members manage calendar events"
  on public.calendar_events
  for all
  using (
    public.is_member_of_firm(firm_id)
    or (
      auth.uid() is not null
      and notified_users is not null
      and auth.uid() = any(notified_users)
    )
  )
  with check (public.is_member_of_firm(firm_id));

-- Cases
drop policy if exists "Firm members manage cases" on public.cases;
create policy "Firm members manage cases"
  on public.cases
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Hearings
drop policy if exists "Firm members manage hearings" on public.hearings;
create policy "Firm members manage hearings"
  on public.hearings
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Documents
drop policy if exists "Firm members manage documents" on public.documents;
create policy "Firm members manage documents"
  on public.documents
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Time entries
drop policy if exists "Firm members manage time entries" on public.time_entries;
create policy "Firm members manage time entries"
  on public.time_entries
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Invoices
drop policy if exists "Firm members manage invoices" on public.invoices;
create policy "Firm members manage invoices"
  on public.invoices
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Firm invitations
drop policy if exists "Firm members manage invitations" on public.firm_invitations;
create policy "Firm members manage invitations"
  on public.firm_invitations
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Notifications
drop policy if exists "Firm members read notifications" on public.notifications;
create policy "Firm members read notifications"
  on public.notifications
  for select
  using (
    public.is_member_of_firm(firm_id)
    or (user_id is not null and user_id = auth.uid())
  );

drop policy if exists "Owner manage notifications" on public.notifications;
create policy "Owner manage notifications"
  on public.notifications
  for all
  using (public.is_member_of_firm(firm_id))
  with check (public.is_member_of_firm(firm_id));

-- Notification preferences
drop policy if exists "Users manage notification preferences" on public.notification_preferences;
create policy "Users manage notification preferences"
  on public.notification_preferences
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);


