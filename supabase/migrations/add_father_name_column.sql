-- Migration to add father_name column to clients table if it doesn't exist
-- This fixes the "Could not find the 'father_name' column" error

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS father_name text;

