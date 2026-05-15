import { ITALIAN_COSTS_CONTEXT } from '../context/italian-costs';
import { REGULATED_WORK_CONTEXT } from '../context/regulated-work';
import { FARM_FEATURES_CONTEXT } from '../context/farm-features';
import { AgentOutputSchema } from '../schema/agent-output';
import type { PropertyInput, ScenarioType, AgentOutput, AgentUsage } from '../types';

export interface AgentResult {
  output: AgentOutput;
  usage: AgentUsage;
  agentName: 'claude' | 'openai' | 'gemini';
}

export type AgentCallResult =
  | { success: true; data: AgentResult }
  | { success: false; error: string; agentName: 'claude' | 'openai' | 'gemini' };

// Shared schema description embedded in every agent prompt
function buildOutputSchemaDescription(): string {
  return `
## Required JSON Output Schema

Respond ONLY with a single valid JSON object. No markdown, no preamble, no trailing text.

{
  "aiAnalysis": {
    "conditionAssessment": {
      "structural": <1-5>,
      "roof": <1-5>,
      "walls": <1-5>,
      "systems": <1-5>,
      "interior": <1-5>,
      "overall": <1-5>,
      "narrative": "<string>"
    },
    "conditionCategory": "<ruin|major_renovation|moderate_renovation|cosmetic|habitable>",
    "estimatedAcquisitionPrice": { "low": <int euros>, "high": <int euros> },
    "locationAnalysis": {
      "proximityToTown": "<string>",
      "touristFlow": "<string>",
      "accessibility": "<string>",
      "views": "<string>",
      "narrative": "<string>"
    },
    "riskFactors": ["<string>", ...],
    "opportunities": ["<string>", ...],
    "guestSeparationFeasibility": {
      "feasible": <boolean>,
      "requiresStructuralWork": <boolean>,
      "notes": "<string>"
    },
    "summaryNarrative": "<string>",
    "confidenceLevel": "estimated"
  },
  "renovationScenario": {
    "scenarioType": "<basic|lifestyle|high_end|custom>",
    "phases": [
      {
        "phaseNumber": <int>,
        "name": "<string>",
        "estimatedMonths": "<e.g. 1-8>",
        "totalCost": { "low": <int>, "high": <int> },
        "lineItems": [
          {
            "key": "<snake_case unique key e.g. phase1_roof_replacement>",
            "description": "<string>",
            "category": "<structural|envelope|systems|finishes|airbnb_fitout|outdoor|energy|professional|contingency>",
            "materialsCost": { "low": <int>, "high": <int> },
            "laborCost": { "low": <int>, "high": <int> },
            "totalCost": { "low": <int>, "high": <int> },
            "diyEligible": <boolean>,
            "diyIneligibleReason": "<string, only if diyEligible is false>"
          }
        ]
      }
    ],
    "farmFeatures": [
      {
        "type": "<feature type key>",
        "included": <boolean>,
        "setupCost": { "low": <int>, "high": <int> },
        "annualOngoingCost": { "low": <int>, "high": <int> },
        "diyEligible": <boolean>,
        "description": "<string>"
      }
    ],
    "totalRenovationCost": { "low": <int>, "high": <int> },
    "contingencyPercent": <number 15-25>,
    "contingencyAmount": { "low": <int>, "high": <int> }
  }
}
  `.trim();
}

export function buildSystemPrompt(): string {
  return `You are an Italian farmhouse renovation cost estimator specializing in rural properties
in central Italy (Umbria, Tuscany, Lazio, Marche). You have deep knowledge of Italian
construction law, building regulations, and regional pricing.

${ITALIAN_COSTS_CONTEXT}

${REGULATED_WORK_CONTEXT}

${FARM_FEATURES_CONTEXT}

## Estimation Rules (non-negotiable)

1. Use Italian pricing — never US/UK/northern European rates
2. Apply the correct regional cost multiplier for the property's region
3. Account for seismic zone 2 (central Italy) — seismic reinforcement is MANDATORY
4. Include a contingency line item of exactly 15–25% (MANDATORY per N2)
5. Mark ALL regulated work as diyEligible: false with the exact Italian legal reason
6. If the scenario includes Airbnb apartments, include guest separation costs as
   explicit line items: independent entrances, sound insulation (60dB min), separate
   terraces, and privacy landscaping
7. Apply IVA at 10% (residential renovation rate) within professional fee line items
8. Include geometra fees (8–12% of construction cost) as a professional line item
9. All monetary values must be integers (euros, no cents)
10. Every line item key must be unique and snake_case

${buildOutputSchemaDescription()}`;
}

export function buildUserPrompt(
  property: PropertyInput,
  scenarioType: ScenarioType,
): string {
  const airbnbNote =
    property.searchCriteria.numberOfAirbnbUnits > 0
      ? `IMPORTANT: This property will include ${property.searchCriteria.numberOfAirbnbUnits} Airbnb apartment(s). ` +
        `Include guest separation costs as explicit line items in category "airbnb_fitout": ` +
        `independent entrances, sound insulation (min 60dB), separate terraces, privacy landscaping.`
      : '';

  const farmNote =
    property.searchCriteria.farmFeatures.length > 0
      ? `Farm features requested: ${property.searchCriteria.farmFeatures.join(', ')}. ` +
        `Include all as FarmFeature entries with realistic Italian costs.`
      : '';

  return `## Property to Estimate

Commune: ${property.commune}, ${property.province}, ${property.region}
Asking price: €${property.askingPrice.toLocaleString()}
Building area: ${property.buildingAreaSqm} sqm
Land area: ${property.landAreaSqm} sqm
Floors: ${property.numberOfFloors}
Construction type: ${property.constructionType}
Energy class: ${property.energyClass}${property.energyConsumption ? ` (${property.energyConsumption} kWh/m²/year)` : ''}
Condition: ${property.conditionCategory}

### Listing Description
${property.description}

### Intended Use
${property.searchCriteria.intendedUse}
${airbnbNote}
${farmNote}

### Scenario
Generate a **${scenarioType}** renovation scenario.

Now produce the JSON estimate.`;
}

export function validateAgentOutput(raw: unknown): AgentOutput {
  const result = AgentOutputSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Agent output failed validation: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return result.data as AgentOutput;
}

export function parseJsonFromText(text: string): unknown {
  const trimmed = text.trim();

  // Handle bare JSON
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  // Strip markdown code fences if present
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1]);
  }

  // Try to find the outermost JSON object
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error('No JSON object found in agent response');
}
