import type { PropertyRow } from '@/app/actions/properties';
import type { ProjectType } from '@/types/project';

export function buildLocationIntelligencePrompt(
  property: PropertyRow,
  projectType: ProjectType = 'farmstead_hosting',
): string {
  const isHosting = projectType === 'farmstead_hosting';

  return `You are an expert on Italian rural living, with deep knowledge of commune-level regulations, rural infrastructure, and the experience of foreign residents in rural Italy.

Analyze the location of this property for practical livability and ${isHosting ? 'hospitality feasibility' : 'private residential use'}.

PROPERTY LOCATION
═════════════════
Commune: ${property.commune || 'unknown'}
Province: ${property.province || 'unknown'}
Region: ${property.region || 'unknown'}
Coordinates: ${property.lat != null && property.lng != null ? `${property.lat}, ${property.lng}` : 'unknown'}
Land: ${property.sqm_land.toLocaleString()} m² (${(property.sqm_land / 10000).toFixed(2)} ha)
Features: ${[
    property.has_olive_grove && 'olive grove',
    property.has_vineyard && 'vineyard',
    property.has_outbuildings && 'outbuildings',
    property.has_pool && 'pool',
    property.has_pizza_oven && 'pizza oven',
  ].filter(Boolean).join(', ') || 'none noted'}

PROJECT TYPE: ${isHosting ? 'FARMSTEAD + HOSTING (Airbnb / agriturismo)' : 'PRIVATE HOMESTEAD (no guests)'}

INSTRUCTIONS
═════════════

1. REGULATORY FEASIBILITY CHECKLIST
For each question, determine the likely regulatory status in this specific commune/province:
- green = generally permitted, straightforward process
- yellow = possible but requires investigation, permits, or specific conditions
- red = likely prohibited or extremely difficult in this area

Questions to answer:
${isHosting ? `- Can you operate a locazione turistica (short-term rental) in this commune?
- Can you operate an agriturismo in this commune?
- Can you host cooking classes or food experiences for guests?
- Can you serve alcohol to guests (somministrazione)?
- Can you keep chickens on this property?
- Can you keep goats on this property?
- Can you have a swimming pool?
- Can you install solar panels (considering landscape protection)?
- What is the seismic classification and renovation implications?
- Can you have animals alongside locazione turistica guests?` : `- Can you keep chickens on this property?
- Can you keep goats on this property?
- Can you have a swimming pool?
- Can you install solar panels (considering landscape protection)?
- What is the seismic classification and renovation implications?
- Are there restrictions on agricultural land use?
- What are the requirements for primary residence (prima casa) registration?`}

For each item provide: question, status (green/yellow/red), detail (1-2 sentences explaining why), source_hint (which office or regulation to verify with).

Do NOT include voltage/electrical differences between Italy and the US — the buyers are already aware of 220V/50Hz and will handle appliance conversion themselves.

2. COMMUNITY PROFILE
Assess this commune/area for:
- Expat presence: are there English-speaking residents? International community?
- Demographics: is this a young/aging town? Population trend?
- Language environment: how much English is spoken in daily interactions?
- Local events: notable sagre, festivals, markets?
- Outdoor activities: hiking, swimming (natural), nature access?
- Cycling: road cycling and gravel riding conditions, terrain?
- Internet connectivity: fiber/ADSL availability, typical speeds, mobile coverage?
- Overall vibe: one-sentence character summary

Be honest and specific. Don't inflate — many Italian rural communes have minimal expat presence and limited English. Say so when true.

Respond using the location_intelligence tool.`;
}

export const LOCATION_INTELLIGENCE_TOOL_SCHEMA = {
  name: 'location_intelligence',
  description: 'Return location intelligence analysis for an Italian property commune.',
  input_schema: {
    type: 'object' as const,
    required: ['regulatory_checklist', 'community'],
    properties: {
      regulatory_checklist: {
        type: 'array',
        items: {
          type: 'object',
          required: ['question', 'status', 'detail', 'source_hint'],
          properties: {
            question: { type: 'string' },
            status: { type: 'string', enum: ['green', 'yellow', 'red'] },
            detail: { type: 'string' },
            source_hint: { type: 'string' },
          },
        },
      },
      community: {
        type: 'object',
        required: [
          'expat_presence', 'demographics', 'language_environment',
          'local_events', 'outdoor_activities', 'cycling',
          'internet_connectivity', 'overall_vibe',
        ],
        properties: {
          expat_presence: { type: 'string' },
          demographics: { type: 'string' },
          language_environment: { type: 'string' },
          local_events: { type: 'string' },
          outdoor_activities: { type: 'string' },
          cycling: { type: 'string' },
          internet_connectivity: { type: 'string' },
          overall_vibe: { type: 'string' },
        },
      },
    },
  },
};
