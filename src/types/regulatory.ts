export type AgriturismoPath = 'agriturismo' | 'locazione_turistica' | 'undetermined';

export interface AgriturismoAssessment {
  recommended_path: AgriturismoPath;
  agriturismo_eligible: boolean;
  agriturismo_requirements: string[];
  agriturismo_advantages: string[];
  locazione_requirements: string[];
  locazione_advantages: string[];
  decision_rationale: string;
  registration_authority?: string;
}

export interface ZoneAssessment {
  zone_id: string;
  zone_name: string;
  opportunity_level: 'high' | 'medium' | 'evaluate' | 'avoid';
  avg_property_price_per_sqm: number;
  airbnb_adr: number;
  airbnb_occupancy_pct: number;
  tourist_flow: 'high' | 'medium' | 'low';
  regulatory_friendliness: 'favorable' | 'neutral' | 'restrictive';
  accessibility_score: number;
  community_receptiveness: 'welcoming' | 'neutral' | 'resistant';
  landscape_protected_pct: number;
  geojson?: object;
}

export interface HouseRules {
  no_smoking: true;
  check_in_time: string;
  check_out_time: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  pets_allowed: boolean;
  max_occupancy_per_unit: number;
  events_allowed: boolean;
  pool_hours_start?: string;
  pool_hours_end?: string;
  custom_rules: string[];
}

export interface AirbnbListingTemplate {
  property_id: string;
  unit_name: string;
  description_en: string;
  description_it: string;
  house_rules: HouseRules;
  no_smoking_signage_languages: ('en' | 'it' | 'de' | 'fr')[];
}
