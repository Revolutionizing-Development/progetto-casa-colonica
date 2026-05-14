export interface LivestockCosts {
  animal_type: 'chickens' | 'goats';
  count: number;
  feed_annual: number;
  bedding_annual: number;
  vet_annual: number;
  hoof_trimming_annual?: number;
  total_annual_min: number;
  total_annual_max: number;
  daily_time_minutes: number;
  income_offset_annual: number;
  income_offset_description: string;
}

export interface PizzaOvenCosts {
  wood_annual: number;
  maintenance_annual: number;
  ingredients_per_event: number;
  events_per_year: number;
  total_annual_min: number;
  total_annual_max: number;
  guest_premium_per_night: number;
}

export interface CourtyardCosts {
  plants_annual: number;
  lighting_maintenance_annual: number;
  furniture_care_annual: number;
  wine_for_tastings_annual: number;
  total_annual_min: number;
  total_annual_max: number;
}

export interface OliveOilProduction {
  tree_count: number;
  yield_litres_min: number;
  yield_litres_max: number;
  price_per_litre: number;
  gross_value_min: number;
  gross_value_max: number;
  maintenance_cost_annual: number;
  pressing_cost_annual: number;
  net_value_min: number;
  net_value_max: number;
  uses: string[];
}

export interface FarmsteadSummary {
  livestock: LivestockCosts[];
  pizza_oven?: PizzaOvenCosts;
  courtyard?: CourtyardCosts;
  olive_oil?: OliveOilProduction;
  total_setup_cost_min: number;
  total_setup_cost_max: number;
  total_annual_operating_min: number;
  total_annual_operating_max: number;
  total_daily_time_minutes: number;
  boar_fencing_needed: boolean;
  boar_fencing_cost_estimate?: number;
}
