import type { ItemCategory, UnitType, RegionalMultiplierKey } from '@/config/cost-line-items';

export type PhaseYear = 1 | 2 | 3 | 4;

export type ScopeToggles = Record<string, boolean>;

export type DIYToggles = Record<string, boolean>;

export type PhaseAssignments = Record<string, PhaseYear>;

export interface DIYProfile {
  id: string;
  project_id: string;
  user_id: string;
  enabled_items: DIYToggles;
  created_at: string;
  updated_at: string;
}

export interface ComputedLineItem {
  key: string;
  description: string;
  description_it: string;
  category: ItemCategory;
  unitType: UnitType;
  unitCost: number;
  quantity: number;
  regionalMultiplier: number;
  contractorCost: number;
  diyCost: number;
  diyEnabled: boolean;
  diyLaborPercent: number;
  diySavings: number;
  effectiveCost: number;
  isRegulated: boolean;
  taxBonus: string;
  phaseYear: PhaseYear;
  isOngoing: boolean;
  isToggled: boolean;
}

export interface PhaseSummary {
  year: PhaseYear;
  label: string;
  items: ComputedLineItem[];
  contractorTotal: number;
  diyTotal: number;
  effectiveTotal: number;
  diySavings: number;
}

export interface CategorySummary {
  category: ItemCategory;
  label: string;
  label_it: string;
  items: ComputedLineItem[];
  contractorTotal: number;
  diyTotal: number;
  effectiveTotal: number;
}

export interface ScenarioCostSummary {
  items: ComputedLineItem[];
  byPhase: PhaseSummary[];
  byCategory: CategorySummary[];
  totalContractor: number;
  totalDiy: number;
  totalEffective: number;
  totalDiySavings: number;
  totalOngoingAnnual: number;
  contingencyAmount: number;
  grandTotal: number;
  region: RegionalMultiplierKey;
}
