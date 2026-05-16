export const STAGE_ORDER = [
  'scouted', 'analyzing', 'shortlisted', 'site_visit', 'negotiating',
  'under_contract', 'closing', 'acquired', 'renovating', 'complete',
] as const;

export type PipelineStage = typeof STAGE_ORDER[number];

export type PipelineEvent = {
  id: string;
  property_id: string;
  from_stage: string | null;
  to_stage: string;
  triggered_by: string;
  gate_overridden: boolean;
  gate_override_reason: string | null;
  notes: string | null;
  created_at: string;
};
