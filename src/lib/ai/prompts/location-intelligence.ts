import type { PropertyRow } from '@/app/actions/properties';
import type { ProjectType } from '@/types/project';

export function buildLocationIntelligencePrompt(
  property: PropertyRow,
  projectType: ProjectType = 'farmstead_hosting',
): string {
  const isHosting = projectType === 'farmstead_hosting';

  return `You are an expert on Italian rural living, with deep knowledge of commune-level regulations, rural infrastructure, transport networks, and the experience of foreign residents in rural Italy.

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

2. TRANSPORT HUBS
Research the nearest transport connections for this commune/area. This is critical for a foreign buyer who will need to travel internationally regularly (especially to France and major European hubs).

TRAIN STATIONS:
- Identify the 1-2 nearest train stations with intercity/regional service (not just local commuter stops)
- For each station, list the key direct destinations with approximate travel times (e.g., "Rome 1h45, Florence 2h, Perugia 45min")
- Include the station's approximate coordinates, estimated drive time and distance from the property

AIRPORTS:
- Identify ALL airports reachable within approximately 2.5 hours drive time from the property
- For each airport, list:
  - Name and IATA code
  - Approximate drive time and distance from property
  - Key airlines operating there
  - Key destinations (especially: flights to France, flights to major European hubs like London, Amsterdam, Frankfurt, Paris)
- Approximate coordinates for each airport
- Order by drive time (nearest first)
- Typically include: nearest regional airport, nearest major hub (Florence/Rome/Milan), any other airports within range

3. COMMUNITY PROFILE
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
  description: 'Return location intelligence analysis for an Italian property commune, including regulatory feasibility, transport hubs, and community profile.',
  input_schema: {
    type: 'object' as const,
    required: ['regulatory_checklist', 'transport_hubs', 'community'],
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
      transport_hubs: {
        type: 'array',
        description: 'Train stations and airports with connection details. Include 1-2 intercity train stations and ALL airports within ~2.5 hours drive.',
        items: {
          type: 'object',
          required: ['type', 'name', 'drive_minutes', 'distance_km', 'lng', 'lat', 'connections'],
          properties: {
            type: { type: 'string', enum: ['train_station', 'airport'] },
            name: { type: 'string', description: 'Station/airport name (e.g., "Chiusi-Chianciano Terme" or "Perugia San Francesco (PEG)")' },
            drive_minutes: { type: 'integer', description: 'Estimated drive time in minutes from the property' },
            distance_km: { type: 'number', description: 'Approximate driving distance in km' },
            lng: { type: 'number', description: 'Longitude of the station/airport' },
            lat: { type: 'number', description: 'Latitude of the station/airport' },
            connections: {
              type: 'array',
              items: { type: 'string' },
              description: 'For train stations: key direct destinations with times (e.g., "Rome Termini 1h45", "Florence SMN 2h"). For airports: key airlines and routes (e.g., "Ryanair: London, Brussels, Bucharest", "ITA Airways: Rome hub connections").',
            },
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
