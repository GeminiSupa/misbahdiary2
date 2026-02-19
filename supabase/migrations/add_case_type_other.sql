-- Add 'other' to matter_case_type enum for custom case types
ALTER TYPE public.matter_case_type ADD VALUE IF NOT EXISTS 'other';

-- Add case_type_other column for custom value when case_type is 'other'
ALTER TABLE public.matters
  ADD COLUMN IF NOT EXISTS case_type_other text;
