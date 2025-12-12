-- Quick fix: Add father_name column to clients table if missing
-- Run this in your Supabase SQL Editor or via the apply-schema script

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS father_name text;

