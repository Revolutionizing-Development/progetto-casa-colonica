/**
 * Sensible defaults for financial model inputs.
 * All monetary values in euros (integers).
 */
export const FINANCIAL_DEFAULTS = {
  notaio_fee_pct: 0.015,
  agency_fee_pct: 0.03,
  registration_tax_pct_resident: 0.02,
  registration_tax_pct_non_resident: 0.09,
  contingency_pct: 0.20,
  renovation_months_typical: 18,
  renovation_months_complex: 24,
  carrying_months: 20,
  income_start_year: 2,
  income_partial_year: 2,
  income_full_year: 3,
  airbnb_platform_fee_pct: 0.03,
  property_management_pct: 0.15,
  annual_maintenance_pct: 0.01,
  farmstead_chickens_annual_min: 510,
  farmstead_chickens_annual_max: 870,
  farmstead_goats_annual_min: 1130,
  farmstead_goats_annual_max: 1970,
  farmstead_pizza_oven_annual_min: 700,
  farmstead_pizza_oven_annual_max: 1300,
  farmstead_courtyard_annual_min: 850,
  farmstead_courtyard_annual_max: 1700,
  boar_fencing_per_ha: 3500,
  guest_separation_cost_min: 9000,
  guest_separation_cost_max: 18000,
  olive_oil_litres_per_tree_min: 1.5,
  olive_oil_litres_per_tree_max: 2.5,
  olive_oil_price_per_litre: 10,
  olive_maintenance_cost_annual: 300,
  olive_pressing_cost_annual: 225,
} as const;

export const SCORING_DEFAULTS = {
  purchase_price: 0.12,
  all_in_cost: 0.12,
  structural_condition: 0.12,
  airbnb_potential: 0.12,
  regulatory_risk: 0.12,
  lifestyle_fit: 0.10,
  location_quality: 0.08,
  land_characteristics: 0.08,
  outbuilding_potential: 0.05,
  negotiation_margin: 0.05,
  exit_value: 0.04,
} as const;

export const LAND_THRESHOLDS = [
  {
    ha: 1,
    alert: 'Fascicolo aziendale may be required',
    implication:
      'Agricultural registration with AGEA may be required. Neighboring farmers have right of first refusal (prelazione agraria) on sale.',
  },
  {
    ha: 3,
    alert: 'Tractor territory',
    implication:
      'Land maintenance at this scale requires a tractor or other equipment, not hand tools. Budget €15,000–€30,000 for equipment or annual contractor costs.',
  },
  {
    ha: 5,
    alert: 'IAP classification risk',
    implication:
      'Above 5 hectares you may be classified as an IAP (Imprenditore Agricolo Professionale), triggering different tax and registration obligations.',
  },
] as const;
