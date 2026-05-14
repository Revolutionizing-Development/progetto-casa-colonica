import type { ConfidenceLevel } from './property';

export interface PurchaseCosts {
  asking_price: number;
  negotiated_price: number;
  notaio_fee: number;
  agency_fee: number;
  registration_tax: number;
  mortgage_tax?: number;
  legal_fees: number;
  survey_cost: number;
  total: number;
}

export interface CarryingCosts {
  imu_annual: number;
  insurance_annual: number;
  utilities_annual: number;
  property_management_annual: number;
  renovation_period_months: number;
  total: number;
}

export interface FarmsteadOperatingCosts {
  chickens_annual: number;
  goats_annual: number;
  pizza_oven_annual: number;
  courtyard_annual: number;
  olive_grove_annual: number;
  total_annual: number;
}

export interface OperatingCosts {
  property_management_pct: number;
  cleaning_per_stay: number;
  utilities_annual: number;
  maintenance_annual: number;
  insurance_annual: number;
  imu_annual: number;
  tari_annual: number;
  platform_fees_pct: number;
  farmstead: FarmsteadOperatingCosts;
  total_annual: number;
}

export type TaxRegime = 'cedolare_secca_21' | 'cedolare_secca_26' | 'progressive';
export type HousingStatus = 'primary_residence' | 'second_home';
export type EmploymentType = 'us_remote' | 'italian_corporate' | 'self_employed' | 'not_working';

export interface TaxModel {
  housing_status: HousingStatus;
  tax_regime: TaxRegime;
  impatriati_regime: boolean;
  employment_type: EmploymentType;
  employment_monthly_net: number;
  employment_duration_months: number;
  effective_tax_rate: number;
  annual_tax_liability: number;
}

export interface ExperienceIncome {
  wine_tastings_enabled: boolean;
  wine_price_per_person: number;
  wine_guests_per_session: number;
  wine_sessions_per_week: number;
  wine_season_weeks: number;
  cooking_classes_enabled: boolean;
  cooking_price_per_person: number;
  cooking_guests_per_session: number;
  cooking_sessions_per_week: number;
  cooking_season_weeks: number;
  farm_experiences_enabled: boolean;
  farm_price_per_person: number;
  farm_guests_per_session: number;
  farm_sessions_per_week: number;
  farm_season_weeks: number;
  olive_oil_enabled: boolean;
  olive_trees: number;
  olive_oil_price_per_litre: number;
}

export interface IncomeProjectionYear {
  year: number;
  accommodation_income: number;
  wine_tasting_income: number;
  cooking_class_income: number;
  farm_experience_income: number;
  olive_oil_income: number;
  employment_income: number;
  total_income: number;
  total_expenses: number;
  net_cashflow: number;
  cumulative_cashflow: number;
  confidence_level: ConfidenceLevel;
}

export interface MonthlyCashFlow {
  month: number;
  year: number;
  label: string;
  inflows: number;
  outflows: number;
  net: number;
  cumulative: number;
  is_liquidity_warning: boolean;
}

export interface FundingSource {
  id: string;
  financial_model_id: string;
  type: 'property_sale' | 'investment_liquidation' | 'salary_savings' | 'existing_cash' | 'currency_conversion' | 'mortgage';
  description: string;
  amount_usd?: number;
  amount_eur: number;
  status: 'planned' | 'in_progress' | 'complete' | 'received';
  expected_date?: string;
  actual_date?: string;
  exchange_rate?: number;
  notes?: string;
}

export interface ROISummary {
  total_investment: number;
  arv: number;
  equity_created: number;
  annual_income_stabilized: number;
  gross_yield_pct: number;
  net_yield_pct: number;
  cash_on_cash_pct: number;
  break_even_year: number;
  irr_5yr?: number;
  confidence_level: ConfidenceLevel;
}

export interface FinancialModel {
  id: string;
  scenario_id: string;
  property_id: string;
  user_id: string;
  purchase_costs: PurchaseCosts;
  carrying_costs: CarryingCosts;
  operating_costs: OperatingCosts;
  tax_model: TaxModel;
  experience_income: ExperienceIncome;
  income_projection: IncomeProjectionYear[];
  monthly_cashflow: MonthlyCashFlow[];
  funding_sources: FundingSource[];
  roi_summary: ROISummary;
  confidence_level: ConfidenceLevel;
  created_at: string;
  updated_at: string;
}
