-- Migration: 002_unique_constraints
-- One search_criteria row per project; one scoring_weights row per project;
-- one tax_deduction_tracker row per property.
-- These unique constraints enable upsert with onConflict.

ALTER TABLE search_criteria
  ADD CONSTRAINT search_criteria_project_id_unique UNIQUE (project_id);

ALTER TABLE scoring_weights
  ADD CONSTRAINT scoring_weights_project_id_unique UNIQUE (project_id);

ALTER TABLE tax_deduction_trackers
  ADD CONSTRAINT tax_deduction_trackers_property_id_unique UNIQUE (property_id);
