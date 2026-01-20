-- Create billing_settings table for firm-level billing configuration
create table if not exists public.billing_settings (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  
  -- Invoice defaults
  invoice_prefix text default 'INV',
  invoice_number_format text default 'YYYY-####', -- YYYY-####, ####, etc.
  next_invoice_number integer default 1,
  
  -- Payment settings
  default_payment_terms_days integer default 30,
  default_currency text default 'PKR',
  
  -- Tax settings (Pakistan-specific)
  sales_tax_rate numeric(5,2) default 18.00, -- GST rate in Pakistan (typically 18%)
  sales_tax_label text default 'GST',
  tax_registration_number text, -- NTN (National Tax Number)
  sales_tax_registration_number text, -- STRN (Sales Tax Registration Number)
  
  -- Payment methods
  payment_methods text[] default array['Bank Transfer', 'Cash', 'Cheque', 'Online Payment'],
  
  -- Bank account details
  bank_name text,
  account_title text,
  account_number text,
  iban text, -- International Bank Account Number
  swift_code text,
  branch_code text,
  branch_address text,
  
  -- Invoice template settings
  invoice_footer text,
  invoice_notes text default 'Payment should be made within the specified due date.',
  
  -- Auto-numbering settings
  auto_generate_invoice_number boolean default true,
  
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  unique (firm_id)
);

-- Create trigger for updated_at
drop trigger if exists set_timestamp_billing_settings on public.billing_settings;
create trigger set_timestamp_billing_settings
before update on public.billing_settings
for each row
execute procedure public.set_updated_at();

-- Create index
create index if not exists billing_settings_firm_id_idx on public.billing_settings(firm_id);

-- Add comment
comment on table public.billing_settings is 'Firm-level billing configuration and invoice defaults';
