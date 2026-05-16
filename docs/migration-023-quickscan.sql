-- Migration 023: Add quickscan JSONB column to properties
-- QuickScan stores lightweight AI triage results (pass/maybe/fail verdict)
-- Uses Claude 3.5 Haiku for ~10x lower cost than full analysis

ALTER TABLE properties ADD COLUMN IF NOT EXISTS quickscan JSONB;

COMMENT ON COLUMN properties.quickscan IS 'QuickScan triage result — lightweight AI verdict (pass/maybe/fail) with key observations. Populated by /api/ai/quickscan.';
