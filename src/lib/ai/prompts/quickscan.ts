import type { PropertyRow } from '@/app/actions/properties';
import type { ProjectType } from '@/types/project';
import { REGION_SEISMIC_ZONES, BOAR_RISK_REGIONS, type ItalianRegion } from '@/config/regions';

/**
 * QuickScan — lightweight AI property triage.
 *
 * Uses Claude 3.5 Haiku for ~10x lower cost than the full Sonnet analysis.
 * Returns a pass/maybe/fail verdict with 5 key observations in ~5-10 seconds.
 * Designed to filter out obvious mismatches before committing to the full 60-120s analysis.
 */

export interface QuickScanResult {
  verdict: 'pass' | 'maybe' | 'fail';
  verdict_reason: string;
  observations: string[];
  renovation_tier: 'cosmetic' | 'moderate' | 'heavy' | 'structural_rebuild';
  price_assessment: 'bargain' | 'fair' | 'overpriced' | 'insufficient_data';
  deal_breakers: string[];
  recommended_next: 'full_analysis' | 'skip' | 'investigate_first';
  scanned_at: string;
}

export function buildQuickScanPrompt(property: PropertyRow, projectType: ProjectType = 'farmstead_hosting'): string {
  const region = property.region as ItalianRegion;
  const seismicZone = REGION_SEISMIC_ZONES[region] ?? '3';
  const wildBoarRisk = BOAR_RISK_REGIONS.includes(region);
  const landHa = property.sqm_land > 0 ? (property.sqm_land / 10000).toFixed(2) : '0';
  const pricePerSqm = property.sqm_house > 0 ? Math.round(property.listed_price / property.sqm_house) : 0;

  const projectLabel = projectType === 'private_homestead'
    ? 'PRIVATE HOMESTEAD (no guests, no rental income)'
    : 'FARMSTEAD + HOSTING (Airbnb / agriturismo)';

  const descSnippet = property.listing_description
    ? property.listing_description.slice(0, 800)
    : 'No description available';

  return `You are a senior Italian property analyst doing a QUICK TRIAGE on a rural Italian property listing. This is NOT a full analysis — just a fast pass/fail screening to decide whether the property is worth investigating further.

PROJECT TYPE: ${projectLabel}

PROPERTY SNAPSHOT
Name: ${property.name}
Location: ${[property.commune, property.province, property.region].filter(Boolean).join(', ')}
Price: €${property.listed_price.toLocaleString()} (€${pricePerSqm}/m² house)
House: ${property.sqm_house} m² · Land: ${property.sqm_land} m² (${landHa} ha)
Bedrooms: ${property.num_bedrooms ?? '?'} · Bathrooms: ${property.num_bathrooms ?? '?'}
Year built: ${property.year_built ?? 'unknown'}
Energy class: ${property.energy_class ?? 'unknown'}
Seismic zone: ${seismicZone}
Wild boar region: ${wildBoarRisk ? 'YES' : 'No'}
Features: ${[
    property.has_olive_grove && 'olive grove',
    property.has_vineyard && 'vineyard',
    property.has_outbuildings && 'outbuildings',
    property.has_pool && 'pool',
    property.has_pizza_oven && 'pizza oven',
  ].filter(Boolean).join(', ') || 'none noted'}

Listing excerpt:
"""
${descSnippet}
"""

INSTRUCTIONS:
Return a quick triage using the tool. Be direct and practical. Do not include voltage/electrical concerns.
${projectType === 'farmstead_hosting'
    ? 'For hosting projects: check if the layout can support guest separation (independent entrance, privacy). Flag if the building is a single-entrance tower or if land is too small for agriturismo.'
    : 'For private homestead: focus on livability, access, privacy, and long-term value.'}

Flag deal breakers immediately: access issues, structural collapse risk, legal problems implied by the listing, location too remote for the intended use, price wildly above market.`;
}

export const QUICKSCAN_TOOL_SCHEMA = {
  name: 'quickscan_property',
  description: 'Return a quick triage assessment of an Italian property listing — pass/maybe/fail with key observations.',
  input_schema: {
    type: 'object' as const,
    required: [
      'verdict',
      'verdict_reason',
      'observations',
      'renovation_tier',
      'price_assessment',
      'deal_breakers',
      'recommended_next',
    ],
    properties: {
      verdict: {
        type: 'string',
        enum: ['pass', 'maybe', 'fail'],
        description: 'pass = worth full analysis, maybe = has concerns but could work, fail = skip this property.',
      },
      verdict_reason: {
        type: 'string',
        description: 'One sentence explaining the verdict.',
      },
      observations: {
        type: 'array',
        items: { type: 'string' },
        description: '3–5 key observations about this property. Be specific and actionable.',
      },
      renovation_tier: {
        type: 'string',
        enum: ['cosmetic', 'moderate', 'heavy', 'structural_rebuild'],
        description: 'Expected renovation scope based on year, energy class, and description.',
      },
      price_assessment: {
        type: 'string',
        enum: ['bargain', 'fair', 'overpriced', 'insufficient_data'],
        description: 'Quick price assessment relative to region/condition/size.',
      },
      deal_breakers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Any immediate deal breakers. Empty array if none found.',
      },
      recommended_next: {
        type: 'string',
        enum: ['full_analysis', 'skip', 'investigate_first'],
        description: 'full_analysis = proceed to full AI analysis, skip = not worth pursuing, investigate_first = check specific concerns before committing to full analysis.',
      },
    },
  },
};
