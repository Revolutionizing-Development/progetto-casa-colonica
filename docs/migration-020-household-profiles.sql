-- Migration 020: Household profiles
-- One per user — stores shared financial inputs that flow into every project.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS household_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  partner_income INTEGER NOT NULL DEFAULT 70000,
  partner_income_location TEXT NOT NULL DEFAULT 'italy',
  impatriat_eligible BOOLEAN NOT NULL DEFAULT true,
  starting_cash INTEGER NOT NULL DEFAULT 600000,
  monthly_savings_rate INTEGER NOT NULL DEFAULT 8000,
  us_phase_months INTEGER NOT NULL DEFAULT 24,
  diy_phase_months INTEGER NOT NULL DEFAULT 24,
  move_date DATE,
  annual_living_costs INTEGER NOT NULL DEFAULT 30000,
  adults INTEGER NOT NULL DEFAULT 2,
  import_folder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE household_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY household_profiles_user_policy ON household_profiles
  FOR ALL USING (user_id = auth.uid()::text);
