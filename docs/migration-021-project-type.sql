-- Migration 021: Add project_type to projects
-- Every project is either a private homestead (no guests, no income)
-- or a farmstead with hosting (Airbnb apartments, experiences).
-- Default to 'farmstead_hosting' for backward compatibility.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type TEXT NOT NULL DEFAULT 'farmstead_hosting';

-- Constrain to valid values
ALTER TABLE projects
  ADD CONSTRAINT chk_project_type
  CHECK (project_type IN ('private_homestead', 'farmstead_hosting'));
