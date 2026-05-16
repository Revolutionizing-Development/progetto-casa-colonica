-- Migration 017: Add multi-agent estimation columns to renovation_scenarios
-- Supports divergence reporting from multi-agent consensus engine

ALTER TABLE renovation_scenarios
  ADD COLUMN IF NOT EXISTS divergence_report JSONB,
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ADD COLUMN IF NOT EXISTS agent_usage JSONB;

COMMENT ON COLUMN renovation_scenarios.divergence_report IS 'Multi-agent divergence report with flagged items and confidence breakdown';
COMMENT ON COLUMN renovation_scenarios.confidence_score IS 'Overall consensus confidence score (0-100) from multi-agent estimation';
COMMENT ON COLUMN renovation_scenarios.agent_usage IS 'Token usage breakdown per agent (claude, openai, gemini, synthesis)';
