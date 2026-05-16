-- Migration 022: Add location_intelligence JSONB to properties
-- Stores AI-generated regulatory checklist, distance cards,
-- community profile, and isochrone configuration per property.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS location_intelligence JSONB;
