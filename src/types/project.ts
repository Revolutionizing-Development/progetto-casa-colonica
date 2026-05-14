export interface SearchCriteria {
  id: string;
  project_id: string;
  user_id: string;
  min_sqm_house?: number;
  max_sqm_house?: number;
  min_sqm_land?: number;
  max_sqm_land?: number;
  min_bedrooms?: number;
  max_purchase_price: number;
  max_all_in_cost: number;
  regions: string[];
  provinces: string[];
  must_have_olive_grove: boolean;
  must_allow_animals: boolean;
  must_have_outbuildings: boolean;
  requires_agriturismo_eligible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScoringWeights {
  id: string;
  project_id: string;
  user_id: string;
  purchase_price: number;
  all_in_cost: number;
  structural_condition: number;
  airbnb_potential: number;
  regulatory_risk: number;
  lifestyle_fit: number;
  location_quality: number;
  land_characteristics: number;
  outbuilding_potential: number;
  negotiation_margin: number;
  exit_value: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  search_criteria?: SearchCriteria;
  scoring_weights?: ScoringWeights;
  created_at: string;
  updated_at: string;
}
