-- Migration 019: Scope toggles, DIY profiles, and phase assignments
-- Run in Supabase SQL Editor.

-- DIY profile lives at project level — your skills don't change per property
CREATE TABLE IF NOT EXISTS diy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  enabled_items JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

ALTER TABLE diy_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY diy_profiles_user_policy ON diy_profiles
  FOR ALL USING (user_id = auth.uid()::text);

-- Scope toggles and phase assignments live on the scenario
ALTER TABLE renovation_scenarios
  ADD COLUMN IF NOT EXISTS scope_toggles JSONB NOT NULL DEFAULT '{}';

ALTER TABLE renovation_scenarios
  ADD COLUMN IF NOT EXISTS phase_assignments JSONB NOT NULL DEFAULT '{}';
