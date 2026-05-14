import type { ConfidenceLevel } from './property';

export type ScenarioType = 'basic' | 'lifestyle' | 'high_end' | 'custom';

export type DIYLevel = 'none' | 'partial' | 'full';

export interface LineItem {
  key: string;
  description: string;
  phase_number: number;
  is_regulated: boolean;
  diy_level: DIYLevel;
  contractor_cost_min: number;
  contractor_cost_max: number;
  diy_cost_min: number;
  diy_cost_max: number;
  contingency_pct: number;
  confidence_level: ConfidenceLevel;
  tax_bonus?: 'ristrutturazione' | 'ecobonus' | 'sismabonus' | 'mobili' | 'none';
  notes?: string;
}

export interface RenovationPhase {
  phase_number: number;
  name: string;
  name_it: string;
  description: string;
  duration_months: number;
  start_month: number;
  line_items: LineItem[];
  total_min: number;
  total_max: number;
  is_energy_work: boolean;
  enea_required: boolean;
}

export interface FarmFeature {
  type: 'chickens' | 'goats' | 'pizza_oven' | 'courtyard' | 'olive_grove' | 'vegetable_garden' | 'wine_cellar';
  enabled: boolean;
  setup_cost_min: number;
  setup_cost_max: number;
  annual_operating_cost_min: number;
  annual_operating_cost_max: number;
  daily_time_minutes?: number;
  annual_income_offset?: number;
  notes: string;
}

export interface OutbuildingConversion {
  name: string;
  description: string;
  start_year: number;
  budget_min: number;
  budget_max: number;
  sqm: number;
  additional_beds: number;
  additional_annual_income: number;
}

export interface ARVEstimate {
  id: string;
  scenario_id: string;
  estimated_arv: number;
  comparable_properties: string[];
  price_per_sqm: number;
  confidence_level: ConfidenceLevel;
  notes: string;
  created_at: string;
}

export interface RenovationScenario {
  id: string;
  property_id: string;
  user_id: string;
  type: ScenarioType;
  name: string;
  name_it: string;
  phases: RenovationPhase[];
  farm_features: FarmFeature[];
  outbuilding_conversions: OutbuildingConversion[];
  renovation_total_min: number;
  renovation_total_max: number;
  renovation_duration_months: number;
  contingency_pct: number;
  contingency_amount: number;
  guest_separation_included: boolean;
  arv_estimate?: ARVEstimate;
  confidence_level: ConfidenceLevel;
  generated_by_ai: boolean;
  created_at: string;
  updated_at: string;
}
