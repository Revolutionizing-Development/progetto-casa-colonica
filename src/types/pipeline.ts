import type { PropertyPipelineStage } from './property';

export interface PipelineEvent {
  id: string;
  property_id: string;
  user_id: string;
  from_stage: PropertyPipelineStage | null;
  to_stage: PropertyPipelineStage;
  triggered_by: string;
  gate_overridden: boolean;
  gate_override_reason?: string;
  notes?: string;
  created_at: string;
}

export interface DecisionGate {
  from_stage: PropertyPipelineStage;
  to_stage: PropertyPipelineStage;
  question: string;
  criteria: GateCriterion[];
}

export interface GateCriterion {
  key: string;
  label: string;
  required_data: string;
  is_met: boolean;
  override_allowed: boolean;
}

export interface Offer {
  id: string;
  property_id: string;
  user_id: string;
  amount: number;
  date: string;
  status: 'submitted' | 'countered' | 'accepted' | 'rejected' | 'withdrawn';
  counter_amount?: number;
  notes?: string;
  created_at: string;
}

export interface SiteVisitTrip {
  id: string;
  property_id: string;
  user_id: string;
  planned_date: string;
  actual_date?: string;
  duration_days: number;
  estimated_cost: number;
  actual_cost?: number;
  accommodation?: string;
  contacts_to_meet: string[];
  checklist_items: TripChecklistItem[];
  notes?: string;
  created_at: string;
}

export interface TripChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  notes?: string;
}

export interface Document {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  document_type: 'visura_catastale' | 'ape' | 'planimetria' | 'compromesso' | 'rogito' | 'geometra_report' | 'contractor_quote' | 'insurance' | 'other';
  file_url: string;
  file_size_bytes: number;
  notes?: string;
  created_at: string;
}

export interface OperationalChecklist {
  id: string;
  property_id: string;
  user_id: string;
  category: ChecklistCategory;
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export type ChecklistCategory =
  | 'team_building'
  | 'pre_purchase_due_diligence'
  | 'purchase_process'
  | 'negotiation'
  | 'inspections'
  | 'payment_mechanics'
  | 'taxes'
  | 'utilities'
  | 'residency'
  | 'property_knowledge'
  | 'contractor_selection'
  | 'remote_management';

export interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'complete';
  due_stage?: PropertyPipelineStage;
  due_date?: string;
  linked_document_id?: string;
  notes?: string;
}
