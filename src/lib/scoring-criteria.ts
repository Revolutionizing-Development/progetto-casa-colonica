import { SCORING_DEFAULTS, SCORING_DEFAULTS_HOMESTEAD } from '@/config/defaults';
import type { ProjectType } from '@/types/project';

export const WEIGHT_KEYS = [
  'purchase_price',
  'all_in_cost',
  'structural_condition',
  'airbnb_potential',
  'regulatory_risk',
  'lifestyle_fit',
  'location_quality',
  'land_characteristics',
  'outbuilding_potential',
  'negotiation_margin',
  'exit_value',
] as const;

export const HOMESTEAD_WEIGHT_KEYS = [
  'purchase_price',
  'all_in_cost',
  'structural_condition',
  'regulatory_risk',
  'lifestyle_fit',
  'location_quality',
  'land_characteristics',
  'exit_value',
] as const;

export type WeightKey = (typeof WEIGHT_KEYS)[number];
export type HomesteadWeightKey = (typeof HOMESTEAD_WEIGHT_KEYS)[number];

export function weightKeysForType(projectType: ProjectType): readonly string[] {
  return projectType === 'private_homestead' ? HOMESTEAD_WEIGHT_KEYS : WEIGHT_KEYS;
}

export function defaultWeightsPct(projectType: ProjectType = 'farmstead_hosting'): Record<string, number> {
  if (projectType === 'private_homestead') {
    return Object.fromEntries(
      HOMESTEAD_WEIGHT_KEYS.map((k) => [k, Math.round(SCORING_DEFAULTS_HOMESTEAD[k] * 100)]),
    );
  }
  return Object.fromEntries(
    WEIGHT_KEYS.map((k) => [k, Math.round(SCORING_DEFAULTS[k] * 100)]),
  );
}

export function scoringDefaultsForType(projectType: ProjectType): Record<string, number> {
  if (projectType === 'private_homestead') {
    return { ...SCORING_DEFAULTS_HOMESTEAD };
  }
  return { ...SCORING_DEFAULTS };
}
