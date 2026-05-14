'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';

export type RegulatoryRisk = 'red' | 'yellow' | 'green';
export type ConfidenceLevel = 'estimated' | 'quoted' | 'confirmed' | 'actual';
export type RenovationComplexity = 'low' | 'medium' | 'high' | 'very_high';

export interface LandAlert {
  threshold_ha: number;
  alert: string;
  implication: string;
}

export interface AIAnalysisRow {
  id: string;
  property_id: string;
  structural_condition_score: number;
  structural_notes: string;
  roof_condition: string;
  systems_condition: string;
  guest_separation_feasible: boolean;
  guest_separation_notes: string;
  guest_separation_cost_min: number;
  guest_separation_cost_max: number;
  voltage_concerns: string[];
  renovation_complexity: RenovationComplexity;
  key_risks: string[];
  key_opportunities: string[];
  confidence_level: ConfidenceLevel;
  created_at: string;
}

export interface RegulatoryAssessmentRow {
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
  seismic_zone: string;
  seismic_risk: RegulatoryRisk;
  animals_permitted: RegulatoryRisk;
  animals_notes: string;
  septic_water: RegulatoryRisk;
  septic_water_notes: string;
  fire_safety: RegulatoryRisk;
  fire_safety_notes: string;
  business_classification: RegulatoryRisk;
  business_classification_notes: string;
  tax_regime_risk: RegulatoryRisk;
  tax_regime_notes: string;
  overall_risk: RegulatoryRisk;
  has_red_flag: boolean;
  agriturismo_eligible: boolean;
  agriturismo_path_notes: string;
  land_threshold_alerts: LandAlert[];
  wild_boar_risk: boolean;
  boar_fencing_cost_estimate: number | null;
  created_at: string;
}

export async function getAIAnalysis(propertyId: string): Promise<AIAnalysisRow | null> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as AIAnalysisRow;
}

export async function getRegulatoryAssessment(
  propertyId: string,
): Promise<RegulatoryAssessmentRow | null> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('regulatory_assessments')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as RegulatoryAssessmentRow;
}
