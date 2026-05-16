export interface HouseholdProfile {
  id: string;
  user_id: string;
  partner_income: number;
  partner_income_location: 'us' | 'italy';
  impatriat_eligible: boolean;
  starting_cash: number;
  monthly_savings_rate: number;
  us_phase_months: number;
  diy_phase_months: number;
  move_date: string | null;
  annual_living_costs: number;
  adults: number;
  import_folder: string | null;
  created_at: string;
  updated_at: string;
}

export const HOUSEHOLD_DEFAULTS: Omit<HouseholdProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  partner_income: 70000,
  partner_income_location: 'italy',
  impatriat_eligible: true,
  starting_cash: 600000,
  monthly_savings_rate: 8000,
  us_phase_months: 24,
  diy_phase_months: 24,
  move_date: null,
  annual_living_costs: 30000,
  adults: 2,
  import_folder: null,
};
