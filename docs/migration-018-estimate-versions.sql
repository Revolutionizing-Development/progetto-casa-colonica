-- Migration 018: Estimate version history
-- Adds version tracking to renovation_scenarios so old estimates are preserved.
-- Run in Supabase SQL Editor.

-- Add version number (auto-incremented per property+type)
ALTER TABLE renovation_scenarios
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Track which version is the active/working copy
ALTER TABLE renovation_scenarios
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Index for fast lookups of active scenarios
CREATE INDEX IF NOT EXISTS idx_renovation_scenarios_active
  ON renovation_scenarios (property_id, type, is_active)
  WHERE is_active = true;

-- Index for version history queries
CREATE INDEX IF NOT EXISTS idx_renovation_scenarios_version
  ON renovation_scenarios (property_id, type, version DESC);
