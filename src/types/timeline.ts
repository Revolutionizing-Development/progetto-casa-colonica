export interface TimelinePhase {
  id: string;
  name: string;
  name_it: string;
  startMonth: number;
  durationMonths: number;
  isContractor: boolean;
  isDiy: boolean;
  costEur: number;
  dependsOn: string[];
  category: 'structural' | 'envelope' | 'systems' | 'finishes' | 'exterior' | 'lifestyle' | 'admin';
}

export interface DecisionGate {
  month: number;
  label: string;
  description: string;
  type: 'move' | 'launch' | 'milestone';
}

export interface FundingInflow {
  label: string;
  monthlyAmount: number;
  startMonth: number;
  endMonth: number;
  type: 'salary_savings' | 'employment_income' | 'rental_income';
}

export interface MonthlySnapshot {
  month: number;
  year: number;
  label: string;
  phaseSpend: number;
  carryingCosts: number;
  livingCosts: number;
  totalOutflow: number;
  fundingInflow: number;
  net: number;
  cumulativeSpend: number;
  cashRemaining: number;
  isLiquidityWarning: boolean;
}

export interface TimelineConfig {
  phases: TimelinePhase[];
  gates: DecisionGate[];
  inflows: FundingInflow[];
  initialCash: number;
  carryingCostMonthly: number;
  livingCostMonthly: number;
  moveMonth: number;
  totalMonths: number;
}

export interface LiquidityWarning {
  month: number;
  phaseId: string;
  phaseName: string;
  shortfall: number;
  suggestion: string;
}
