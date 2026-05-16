import type { PropertyRow } from '@/app/actions/properties';
import type { AIAnalysisRow } from '@/app/actions/ai';
import type { ProjectType } from '@/types/project';

export function buildScenariosPrompt(
  property: PropertyRow,
  analysis: AIAnalysisRow | null,
  scenarioType: 'basic' | 'lifestyle',
  projectType: ProjectType = 'farmstead_hosting',
): string {
  const landHa = (property.sqm_land / 10000).toFixed(2);

  const features: string[] = [];
  if (property.has_olive_grove)
    features.push(`olive grove${property.olive_tree_count ? ` (${property.olive_tree_count} trees)` : ''}`);
  if (property.has_vineyard) features.push('vineyard');
  if (property.has_outbuildings)
    features.push(`outbuildings${property.outbuilding_sqm ? ` (${property.outbuilding_sqm} m²)` : ''}`);
  if (property.has_pool) features.push('pool');
  if (property.has_pizza_oven) features.push('pizza oven');

  const analysisSection = analysis
    ? `Structural score: ${analysis.structural_condition_score}/10 · Complexity: ${analysis.renovation_complexity} · Roof: ${analysis.roof_condition} · Systems: ${analysis.systems_condition} · Guest sep feasible: ${analysis.guest_separation_feasible} (€${analysis.guest_separation_cost_min.toLocaleString()}–€${analysis.guest_separation_cost_max.toLocaleString()})`
    : 'No structural analysis available.';

  const isHomestead = projectType === 'private_homestead';

  let scenarioGuide: string;
  if (scenarioType === 'basic') {
    scenarioGuide = `SCENARIO TYPE: BASIC
Generate ONE "Basic" scenario: minimum viable renovation to make this property structurally sound, legally habitable (agibilità obtained), and comfortable for owners. Focus on mandatory structural/systems work only — no luxury finishes. No farm features. Outbuilding conversions only if essential.${isHomestead ? '\nThis is a PRIVATE HOMESTEAD — no guest accommodation, no income-generating features. Guest separation is not needed.' : ''}`;
  } else {
    scenarioGuide = isHomestead
      ? `SCENARIO TYPE: LIFESTYLE
Generate ONE "Lifestyle" scenario: full personal farmstead transformation including everything in Basic PLUS the rural Italian lifestyle for personal enjoyment — olive grove activation, courtyard, outdoor dining, personal workshop or studio. NO guest accommodation, NO income-generating conversions. Set guest_separation_included to false. Farm features should focus on personal use (home garden, personal olive harvest, etc.), not commercial operations. Outbuilding conversions are for personal use (workshop, studio, storage).`
      : `SCENARIO TYPE: LIFESTYLE
Generate ONE "Lifestyle" scenario: full farmstead transformation including everything in Basic PLUS the rural Italian lifestyle — olive grove activation, courtyard, guest accommodation, outdoor entertaining. Include relevant farm features and outbuilding conversions.`;
  }

  return `You are an Italian farmhouse renovation consultant. Generate a single renovation scenario for this property.

PROPERTY: ${property.name} · ${property.commune}, ${property.province}, ${property.region}
House: ${property.sqm_house} m² · ${property.num_bedrooms ?? '?'}bd/${property.num_bathrooms ?? '?'}ba · Built: ${property.year_built ?? 'unknown'} · Energy: ${property.energy_class ?? 'G (assume worst)'}
Land: ${landHa} ha · Features: ${features.join(', ') || 'none'}
Price: €${property.listed_price.toLocaleString()}
Analysis: ${analysisSection}

${scenarioGuide}

COST RULES (non-negotiable):
- All costs in euros. Rural Italian contractor rates (not city rates).
- Structural: €1,200–1,800/m². Finishing: €600–900/m². Systems: priced per item.
- contingency_pct: always exactly 0.20. contingency_amount: 0.20 × midpoint of total.
- Mark is_regulated: true for structural work, new plumbing/electrical, permits required.
- Tax bonuses: ristrutturazione (structural/finishing), ecobonus (thermal/energy), sismabonus (seismic), mobili (furniture), none.
- ENEA filing required for all energy upgrades.

OUTPUT CONSTRAINTS (strictly enforce — exceeding these causes truncation errors):
- Maximum 4 phases total.
- Maximum 4 line items per phase.
- All description fields: 8 words maximum. notes field: 10 words maximum or omit entirely.
- Farm features: maximum 4 entries, only types directly relevant to this property.
- Outbuilding conversions: maximum 2 entries.`;
}

export const SCENARIO_TOOL_SCHEMA = {
  name: 'generate_renovation_scenario',
  description: 'Generate a single renovation scenario (basic or lifestyle) for an Italian farmhouse.',
  input_schema: {
    type: 'object' as const,
    required: [
      'type', 'name', 'name_it', 'phases',
      'renovation_total_min', 'renovation_total_max',
      'renovation_duration_months', 'contingency_pct', 'contingency_amount',
      'guest_separation_included', 'farm_features', 'outbuilding_conversions',
    ],
    properties: {
      type: { type: 'string', enum: ['basic', 'lifestyle'] },
      name: { type: 'string' },
      name_it: { type: 'string' },
      renovation_total_min: { type: 'integer' },
      renovation_total_max: { type: 'integer' },
      contingency_pct: { type: 'number' },
      contingency_amount: { type: 'integer' },
      renovation_duration_months: { type: 'integer' },
      guest_separation_included: { type: 'boolean' },
      phases: {
        type: 'array',
        items: {
          type: 'object',
          required: ['phase_number', 'name', 'name_it', 'description', 'duration_months', 'start_month', 'line_items', 'total_min', 'total_max', 'is_energy_work', 'enea_required'],
          properties: {
            phase_number: { type: 'integer' },
            name: { type: 'string' },
            name_it: { type: 'string' },
            description: { type: 'string' },
            duration_months: { type: 'integer' },
            start_month: { type: 'integer' },
            total_min: { type: 'integer' },
            total_max: { type: 'integer' },
            is_energy_work: { type: 'boolean' },
            enea_required: { type: 'boolean' },
            line_items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['key', 'description', 'phase_number', 'is_regulated', 'diy_level', 'contractor_cost_min', 'contractor_cost_max', 'contingency_pct', 'confidence_level'],
                properties: {
                  key: { type: 'string' },
                  description: { type: 'string' },
                  phase_number: { type: 'integer' },
                  is_regulated: { type: 'boolean' },
                  diy_level: { type: 'string', enum: ['none', 'partial', 'full'] },
                  contractor_cost_min: { type: 'integer' },
                  contractor_cost_max: { type: 'integer' },
                  contingency_pct: { type: 'number' },
                  confidence_level: { type: 'string', enum: ['estimated', 'quoted', 'confirmed', 'actual'] },
                  tax_bonus: { type: 'string', enum: ['ristrutturazione', 'ecobonus', 'sismabonus', 'mobili', 'none'] },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
      },
      farm_features: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type', 'enabled', 'setup_cost_min', 'setup_cost_max', 'annual_operating_cost_min', 'annual_operating_cost_max', 'notes'],
          properties: {
            type: { type: 'string', enum: ['chickens', 'goats', 'pizza_oven', 'courtyard', 'olive_grove', 'vegetable_garden', 'wine_cellar'] },
            enabled: { type: 'boolean' },
            setup_cost_min: { type: 'integer' },
            setup_cost_max: { type: 'integer' },
            annual_operating_cost_min: { type: 'integer' },
            annual_operating_cost_max: { type: 'integer' },
            daily_time_minutes: { type: 'integer' },
            annual_income_offset: { type: 'integer' },
            notes: { type: 'string' },
          },
        },
      },
      outbuilding_conversions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'description', 'start_year', 'budget_min', 'budget_max', 'sqm', 'additional_beds', 'additional_annual_income'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            start_year: { type: 'integer' },
            budget_min: { type: 'integer' },
            budget_max: { type: 'integer' },
            sqm: { type: 'integer' },
            additional_beds: { type: 'integer' },
            additional_annual_income: { type: 'integer' },
          },
        },
      },
    },
  },
};
