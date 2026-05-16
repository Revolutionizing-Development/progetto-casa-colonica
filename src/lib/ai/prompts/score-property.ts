import type { PropertyRow } from '@/app/actions/properties';
import type { AIAnalysisRow, RegulatoryAssessmentRow } from '@/app/actions/ai';
import type { RenovationScenario } from '@/types/renovation';
import type { ProjectType } from '@/types/project';

const CRITERIA_DESCRIPTIONS: Record<string, string> = {
  purchase_price: 'Is the asking price fair for this region and condition? €/m² vs comparable rural properties. 10 = steeply underpriced, 5 = fair market value, 0 = significantly overpriced.',
  all_in_cost: 'Total investment (purchase + renovation + contingency). 10 = all-in under €300k, 7 = €400–600k, 5 = €600–800k, 3 = €800k–1.2M, 0 = >€1.5M.',
  structural_condition: 'Physical state of the building. 10 = excellent/move-in ready, 5 = moderate work needed, 0 = structural collapse risk.',
  airbnb_potential: 'Rural tourism income potential. Consider: region desirability, beds available, proximity to attractions, property character. 10 = premium wine-route location, 6-bed+, 5 = decent market, 0 = inaccessible/no tourist appeal.',
  regulatory_risk: 'Combined regulatory exposure. 10 = all green (no issues), 7 = yellow flags only (manageable), 3 = one red flag, 0 = multiple red flags blocking development.',
  lifestyle_fit: 'How well does this match a rural Italian farmhouse lifestyle (olive grove, courtyard, farmstead features, historic character)? 10 = quintessential country life, 5 = functional rural property, 0 = industrial/suburban feel.',
  location_quality: 'Setting, access, and proximity to services. Consider: iconic landscape (Chianti, Val d\'Orcia etc.), road access, nearest town, elevation, views. 10 = prime iconic setting, 5 = decent rural area, 0 = remote and impractical.',
  land_characteristics: 'Quality and usability of the land. Consider: productive farmland, olive trees, terracing, water access, flood risk. 10 = productive diverse agricultural land, 5 = usable land with some work, 0 = problematic (flood risk, steep unusable terrain).',
  outbuilding_potential: 'Potential for outbuildings to generate income or expansion. 10 = substantial convertible outbuildings 200m²+, 5 = some outbuildings, 0 = no outbuildings.',
  negotiation_margin: 'Room to negotiate below asking price. Consider: time on market (if known), market conditions in region, condition issues. 10 = significant discount likely (>15%), 5 = 5–10% reduction possible, 0 = priced firm or multiple offers.',
  exit_value: 'Long-term value appreciation and resale liquidity. Consider: region trend, international buyer appeal, post-renovation ARV. 10 = strong appreciation market with deep buyer pool, 5 = stable value, 0 = declining market with limited buyers.',
};

export function buildScoringPrompt(
  property: PropertyRow,
  analysis: AIAnalysisRow | null,
  regulatory: RegulatoryAssessmentRow | null,
  scenarios: RenovationScenario[],
  weights: Record<string, number>,
  projectType: ProjectType = 'farmstead_hosting',
  activeKeys: readonly string[] = Object.keys(weights),
): string {
  const landHa = (property.sqm_land / 10000).toFixed(2);
  const pricePerSqm = Math.round(property.listed_price / property.sqm_house);

  const scenarioSummary = scenarios.length
    ? scenarios
        .map(
          (s) =>
            `  ${s.name}: €${s.renovation_total_min.toLocaleString()}–€${s.renovation_total_max.toLocaleString()} + €${s.contingency_amount.toLocaleString()} contingency`,
        )
        .join('\n')
    : '  No scenarios generated yet';

  const weightPct = (k: string) => `${Math.round((weights[k] ?? 0) * 100)}%`;

  const projectContext = projectType === 'private_homestead'
    ? 'This is a PRIVATE HOMESTEAD project — no guest hosting, no rental income. Evaluate purely for personal residential use, livability, and long-term value.'
    : 'This is a FARMSTEAD + HOSTING project — intended for Airbnb, agriturismo, or rural tourism income alongside personal use.';

  const criteriaList = activeKeys
    .map((k, i) => `${i + 1}. ${k} (${weightPct(k)}) — ${CRITERIA_DESCRIPTIONS[k] ?? k}`)
    .join('\n\n');

  return `You are scoring an Italian farmhouse property for acquisition feasibility. Rate each criterion on a scale of 0–10 where 10 = best possible and 0 = worst possible. Higher always means better — including for cost criteria (10 = cheapest, 0 = most expensive) and risk criteria (10 = zero risk, 0 = maximum risk).

Be honest and precise. Do not inflate scores. A mid-range property should score 5–6 on most criteria, not 8+. Reserve 8–10 for genuinely exceptional attributes.

## PROJECT TYPE
${projectContext}

## PROPERTY DATA

Name: ${property.name}
Location: ${property.commune}, ${property.province}, ${property.region}
Listed price: €${property.listed_price.toLocaleString()} (€${pricePerSqm}/m²)
House: ${property.sqm_house} m² · ${property.num_bedrooms ?? '?'} beds · ${property.num_bathrooms ?? '?'} baths
Land: ${property.sqm_land.toLocaleString()} m² (${landHa} ha)
Year built: ${property.year_built ?? 'unknown'}
Energy class: ${property.energy_class ?? 'unknown'}
Features: ${[
    property.has_olive_grove && `olive grove${property.olive_tree_count ? ` (${property.olive_tree_count} trees)` : ''}`,
    property.has_vineyard && 'vineyard',
    property.has_outbuildings && `outbuildings${property.outbuilding_sqm ? ` (${property.outbuilding_sqm} m²)` : ''}`,
    property.has_pool && 'pool',
    property.has_pizza_oven && 'pizza oven',
  ]
    .filter(Boolean)
    .join(', ') || 'none noted'}

## AI STRUCTURAL ANALYSIS
${
  analysis
    ? `Structural condition: ${analysis.structural_condition_score}/10
Renovation complexity: ${analysis.renovation_complexity}
Roof: ${analysis.roof_condition}
Systems: ${analysis.systems_condition}${projectType === 'farmstead_hosting' ? `\nGuest separation feasible: ${analysis.guest_separation_feasible}` : ''}
Key risks: ${analysis.key_risks.join('; ')}
Key opportunities: ${analysis.key_opportunities.join('; ')}`
    : 'Not yet completed.'
}

## REGULATORY ASSESSMENT
${
  regulatory
    ? `Overall risk: ${regulatory.overall_risk.toUpperCase()}
STR zoning: ${regulatory.str_zoning} — ${regulatory.str_zoning_notes}
Change of use: ${regulatory.change_of_use} — ${regulatory.change_of_use_notes}
Building permits: ${regulatory.building_permits}
Landscape protection: ${regulatory.landscape_protection}${projectType === 'farmstead_hosting' ? `\nAgriturismo eligible: ${regulatory.agriturismo_eligible}` : ''}`
    : 'Not yet completed.'
}

## RENOVATION SCENARIOS
${scenarioSummary}

## SCORING CRITERIA (weights used by this project)

Score each criterion 0–10. Guidance:

${criteriaList}

Respond using the score_property tool. Keep notes to 1–2 sentences each.`;
}

export function buildScoreToolSchema(activeKeys: readonly string[]) {
  return {
    name: 'score_property',
    description: `Score an Italian farmhouse property across ${activeKeys.length} weighted acquisition criteria.`,
    input_schema: {
      type: 'object' as const,
      required: ['scores'],
      properties: {
        scores: {
          type: 'object',
          required: [...activeKeys],
          properties: Object.fromEntries(
            activeKeys.map((k) => [
              k,
              {
                type: 'object',
                required: ['raw_score', 'notes'],
                properties: {
                  raw_score: { type: 'number', minimum: 0, maximum: 10 },
                  notes: { type: 'string' },
                },
              },
            ]),
          ),
        },
      },
    },
  };
}

export const SCORE_TOOL_SCHEMA = buildScoreToolSchema([
  'purchase_price', 'all_in_cost', 'structural_condition', 'airbnb_potential',
  'regulatory_risk', 'lifestyle_fit', 'location_quality', 'land_characteristics',
  'outbuilding_potential', 'negotiation_margin', 'exit_value',
]);
