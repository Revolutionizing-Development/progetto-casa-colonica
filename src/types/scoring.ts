import type { RegulatoryRisk } from './property';

export interface CriterionScore {
  criterion: string;
  weight: number;
  raw_score: number;
  weighted_score: number;
  confidence_level: 'estimated' | 'quoted' | 'confirmed' | 'actual';
  notes: string;
}

export type OverallRating = 'strong_candidate' | 'promising' | 'marginal' | 'not_recommended';

export interface ScoringResult {
  id: string;
  property_id: string;
  project_id: string;
  user_id: string;
  scores: {
    purchase_price: CriterionScore;
    all_in_cost: CriterionScore;
    structural_condition: CriterionScore;
    airbnb_potential: CriterionScore;
    regulatory_risk: CriterionScore;
    lifestyle_fit: CriterionScore;
    location_quality: CriterionScore;
    land_characteristics: CriterionScore;
    outbuilding_potential: CriterionScore;
    negotiation_margin: CriterionScore;
    exit_value: CriterionScore;
  };
  total_weighted_score: number;
  overall_rating: OverallRating;
  red_flag_override: boolean;
  red_flag_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ComparisonMatrix {
  id: string;
  project_id: string;
  user_id: string;
  property_ids: string[];
  scenario_ids: string[];
  generated_narrative?: string;
  created_at: string;
}
