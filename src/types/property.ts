export type ConfidenceLevel = 'estimated' | 'quoted' | 'confirmed' | 'actual';

export type PropertyPipelineStage =
  | 'scouted'
  | 'analyzing'
  | 'shortlisted'
  | 'site_visit'
  | 'negotiating'
  | 'under_contract'
  | 'closing'
  | 'acquired'
  | 'renovating'
  | 'complete';

export type EnergyClass = 'A4' | 'A3' | 'A2' | 'A1' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export type RegulatoryRisk = 'red' | 'yellow' | 'green';

export interface ListingData {
  url?: string;
  source?: string;
  listed_price: number;
  sqm_house: number;
  sqm_land: number;
  num_bedrooms: number;
  num_bathrooms: number;
  year_built?: number;
  energy_class?: EnergyClass;
  has_olive_grove: boolean;
  olive_tree_count?: number;
  has_vineyard: boolean;
  has_outbuildings: boolean;
  outbuilding_sqm?: number;
  has_pool: boolean;
  has_pizza_oven: boolean;
  commune: string;
  province: string;
  region: string;
  lat?: number;
  lng?: number;
  description?: string;
}

export interface AIAnalysis {
  id: string;
  property_id: string;
  structural_condition_score: number;
  structural_notes: string;
  roof_condition: string;
  systems_condition: string;
  guest_separation_feasible: boolean;
  guest_separation_notes: string;
  guest_separation_additional_cost_min: number;
  guest_separation_additional_cost_max: number;
  voltage_concerns: string[];
  renovation_complexity: 'low' | 'medium' | 'high' | 'very_high';
  key_risks: string[];
  key_opportunities: string[];
  raw_response?: string;
  confidence_level: ConfidenceLevel;
  created_at: string;
}

export interface RegulatoryAssessment {
  id: string;
  property_id: string;
  str_zoning: RegulatoryRisk;
  str_zoning_notes: string;
  change_of_use: RegulatoryRisk;
  change_of_use_notes: string;
  building_permits: RegulatoryRisk;
  building_permits_notes: string;
  landscape_protection: RegulatoryRisk;
  landscape_protection_notes: string;
  seismic_zone: '1' | '2' | '3' | '4';
  seismic_risk: RegulatoryRisk;
  animals_permitted: RegulatoryRisk;
  animals_notes: string;
  septic_water: RegulatoryRisk;
  septic_water_notes: string;
  fire_safety: RegulatoryRisk;
  fire_safety_notes: string;
  business_classification: RegulatoryRisk;
  business_classification_notes: string;
  tax_regime: RegulatoryRisk;
  tax_regime_notes: string;
  overall_risk: RegulatoryRisk;
  has_red_flag: boolean;
  agriturismo_eligible: boolean;
  agriturismo_path_notes: string;
  land_ha: number;
  land_threshold_alerts: LandThresholdAlert[];
  wild_boar_risk: boolean;
  boar_fencing_cost_estimate?: number;
  created_at: string;
}

export interface LandThresholdAlert {
  threshold_ha: number;
  alert: string;
  implication: string;
}

export interface EnergyAssessment {
  id: string;
  property_id: string;
  current_class: EnergyClass;
  target_class: EnergyClass;
  insulation_needed: boolean;
  heat_pump_feasible: boolean;
  solar_pv_feasible: boolean;
  solar_pv_kw?: number;
  window_upgrade_needed: boolean;
  estimated_upgrade_cost_min: number;
  estimated_upgrade_cost_max: number;
  annual_energy_cost_before: number;
  annual_energy_cost_after: number;
  payback_years: number;
  ecobonus_eligible: boolean;
  confidence_level: ConfidenceLevel;
  created_at: string;
}

export interface LayoutAssessment {
  id: string;
  property_id: string;
  conflicts: LayoutConflict[];
  guest_entrance_independent: boolean;
  courtyard_usable: boolean;
  animal_zone_compatible: boolean;
  solar_compatible: boolean;
  parking_sufficient: boolean;
  created_at: string;
}

export interface LayoutConflict {
  element_a: string;
  element_b: string;
  conflict_type: string;
  severity: 'info' | 'warning' | 'blocking';
  resolution: string;
}

export interface Property {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  pipeline_stage: PropertyPipelineStage;
  listing_data: ListingData;
  ai_analysis?: AIAnalysis;
  regulatory_assessment?: RegulatoryAssessment;
  energy_assessment?: EnergyAssessment;
  layout_assessment?: LayoutAssessment;
  notes?: string;
  created_at: string;
  updated_at: string;
}
