import { REGION_SEISMIC_ZONES, BOAR_RISK_REGIONS, type ItalianRegion } from '@/config/regions';
import type { PropertyRow } from '@/app/actions/properties';
import type { ProjectType } from '@/types/project';

export interface LandAlert {
  threshold_ha: number;
  alert: string;
  implication: string;
}

/** Pre-compute facts the AI would otherwise have to guess */
export function computeContextualFacts(property: PropertyRow): {
  seismicZone: string;
  wildBoarRisk: boolean;
  boarFencingCostEstimate: number | null;
  landAlerts: LandAlert[];
} {
  const region = property.region as ItalianRegion;
  const seismicZone = REGION_SEISMIC_ZONES[region] ?? '3';
  const wildBoarRisk = BOAR_RISK_REGIONS.includes(region);
  const landHa = property.land_ha ?? property.sqm_land / 10000;

  const boarFencingCostEstimate =
    wildBoarRisk && landHa > 0
      ? Math.round(landHa * 3500)
      : null;

  const landAlerts: LandAlert[] = [];
  if (landHa >= 1) {
    landAlerts.push({
      threshold_ha: 1,
      alert: 'Fascicolo aziendale + Prelazione agraria',
      implication:
        'Agricultural registration (fascicolo aziendale) may be required. Neighboring farmers have right of first refusal (prelazione agraria) on sale. Commune can fine for unmaintained land (fire risk).',
    });
  }
  if (landHa >= 3) {
    landAlerts.push({
      threshold_ha: 3,
      alert: 'Tractor territory',
      implication:
        'Land maintenance at this scale requires agricultural equipment, not hand tools. Budget for a small tractor or contract maintenance (€1,500–3,000/yr).',
    });
  }
  if (landHa >= 5) {
    landAlerts.push({
      threshold_ha: 5,
      alert: 'IAP consideration',
      implication:
        'At 5+ ha, operating as agriturismo may trigger Imprenditore Agricolo Professionale (IAP) classification requirements. Consult a commercialista with agriturismo experience.',
    });
  }

  return { seismicZone, wildBoarRisk, boarFencingCostEstimate, landAlerts };
}

export function buildAnalysisPrompt(property: PropertyRow, projectType: ProjectType = 'farmstead_hosting'): string {
  const landHa = (property.sqm_land / 10000).toFixed(2);
  const { seismicZone, wildBoarRisk, landAlerts } = computeContextualFacts(property);

  const features: string[] = [];
  if (property.has_olive_grove) features.push(`Olive grove${property.olive_tree_count ? ` (approx. ${property.olive_tree_count} trees)` : ''}`);
  if (property.has_vineyard) features.push('Vineyard');
  if (property.has_outbuildings) features.push(`Outbuildings${property.outbuilding_sqm ? ` (${property.outbuilding_sqm} m²)` : ''}`);
  if (property.has_pool) features.push('Pool');
  if (property.has_pizza_oven) features.push('Pizza oven');

  const energyNote =
    property.energy_class === 'G'
      ? 'Class G — no insulation (worst class, full thermal envelope overhaul needed)'
      : property.energy_class === 'F' || property.energy_class === 'E'
      ? `Class ${property.energy_class} — poor insulation (significant upgrade needed)`
      : property.energy_class
      ? `Class ${property.energy_class}`
      : 'Unknown (assume poor — typical for pre-1990 Italian farmhouses)';

  const descriptionSection = property.listing_description
    ? `\n\nListing description (original Italian or English):\n"""\n${property.listing_description.slice(0, 3000)}\n"""`
    : '\n\nNo listing description provided — base analysis on property data above.';

  const notesSection = property.notes
    ? `\n\nBuyer's notes:\n"""\n${property.notes.slice(0, 1000)}\n"""`
    : '';

  const landAlertText =
    landAlerts.length > 0
      ? landAlerts.map((a) => `  • ${a.alert}: ${a.implication}`).join('\n')
      : '  • None (land under 1 ha)';

  const projectContext = projectType === 'private_homestead'
    ? 'evaluating rural farmhouses for foreign buyers seeking a private family home — no guest hosting, no rental income. Focus on livability, personal comfort, and long-term value.'
    : 'evaluating rural farmhouses for foreign buyers seeking combined living and hospitality use (Airbnb / agriturismo).';

  const guestSeparationSection = projectType === 'farmstead_hosting'
    ? `\nGUEST SEPARATION (Constitution requirement — hard check):
Per N10: guest apartments must have independent entrances, separate outdoor seating, no sightlines to owner spaces, sound insulation. Assess whether this property's described layout can feasibly support this. Flag early if impossible (e.g., single-entrance tower house).`
    : `\nGUEST SEPARATION:
This is a private homestead project — guest separation is not required. Set guest_separation_feasible to false, guest_separation_cost_min/max to 0, and note "Not applicable — private homestead project".`;

  const taxNote = projectType === 'farmstead_hosting'
    ? '\nTAX REGIME NOTE: Cedolare secca (21%/26%) applies to locazione turistica. Agriturismo uses a different flat-rate regime (IVA 50% deduction). Evaluate which path suits this property\'s land characteristics and intended use.'
    : '\nTAX REGIME NOTE: Evaluate IMU classification and any tax advantages for primary residence (prima casa) if the buyer intends to establish residency.';

  return `You are a senior Italian property analyst with 20+ years of experience ${projectContext} You understand Italian building law (DPR 380/2001), landscape protection (D.Lgs 42/2004), short-term rental regulations, agriturismo law (L. 96/2006), seismic risk, and rural renovation practice.

Analyze the following Italian farmhouse property. Use the tool to return a structured assessment.

PROJECT TYPE: ${projectType === 'private_homestead' ? 'PRIVATE HOMESTEAD — no guests, no income' : 'FARMSTEAD + HOSTING — Airbnb / agriturismo income'}

PROPERTY DATA
═══════════════════════════════════════════════════════
Name: ${property.name}
Location: ${[property.commune, property.province, property.region].filter(Boolean).join(', ')}
House: ${property.sqm_house} m²
Land: ${property.sqm_land} m² (${landHa} ha)
Bedrooms: ${property.num_bedrooms ?? 'unknown'}
Bathrooms: ${property.num_bathrooms ?? 'unknown'}
Year built: ${property.year_built ?? 'unknown'}
Energy class: ${energyNote}
Features: ${features.length > 0 ? features.join(', ') : 'None specified'}
Listed price: €${property.listed_price.toLocaleString()}

PRE-COMPUTED CONTEXTUAL FACTS (authoritative — do not override)
═══════════════════════════════════════════════════════
Seismic zone: ${seismicZone} (${seismicZone === '1' ? 'Highest risk' : seismicZone === '2' ? 'High risk — central Italy standard' : seismicZone === '3' ? 'Medium risk' : 'Low risk'})
Wild boar risk: ${wildBoarRisk ? `YES — ${property.region} is a known boar-affected region` : 'No — region not in primary boar zone'}
Land size alerts:
${landAlertText}
${descriptionSection}${notesSection}

ANALYSIS INSTRUCTIONS
═══════════════════════════════════════════════════════

STRUCTURAL ASSESSMENT:
Score condition 1–10 (1=ruin, 5=livable with work, 8=good, 10=pristine).
Italian farmhouses from pre-1900: assume structural walls are solid stone but expect: cracked plaster, deteriorated roof tiles, absent insulation, outdated/absent electrical and plumbing, old septic systems. Focus on what's implied by year built, energy class, and listing description.
${guestSeparationSection}

REGULATORY RISK — 10 categories, score red/yellow/green:
• red = blocking concern — must resolve before proceeding
• yellow = investigate — requires professional verification
• green = likely clear — no significant risk identified

Be appropriately conservative. When uncertain, prefer yellow over green. Use the pre-computed seismic zone — do not infer it from region name.

Do NOT include voltage/electrical differences between Italy and the US — the buyers are already aware of 220V/50Hz and will handle appliance conversion themselves. Do not mention transformers, plug adapters, or CEI standards.
${taxNote}

OVERALL RISK: If ANY category is red, overall_risk must be red.`;
}

/** Tool schema for Claude tool_use (structured JSON output) */
export const ANALYSIS_TOOL_SCHEMA = {
  name: 'analyze_italian_property',
  description:
    'Return a structured feasibility analysis for an Italian farmhouse property, covering structural condition and regulatory risk assessment.',
  input_schema: {
    type: 'object' as const,
    required: ['analysis', 'regulatory'],
    properties: {
      analysis: {
        type: 'object',
        required: [
          'structural_condition_score',
          'structural_notes',
          'roof_condition',
          'systems_condition',
          'guest_separation_feasible',
          'guest_separation_notes',
          'guest_separation_cost_min',
          'guest_separation_cost_max',
          'renovation_complexity',
          'key_risks',
          'key_opportunities',
        ],
        properties: {
          structural_condition_score: {
            type: 'number',
            description: '1–10 overall structural condition (1=total ruin, 5=livable with major work, 10=excellent)',
          },
          structural_notes: {
            type: 'string',
            description: '2–4 sentences on overall structural condition, wall integrity, foundation concerns.',
          },
          roof_condition: {
            type: 'string',
            description: 'Condition of roof — likely state given year and energy class, what work is needed.',
          },
          systems_condition: {
            type: 'string',
            description: 'Electrical, plumbing, heating, septic — likely state and what needs replacing.',
          },
          guest_separation_feasible: {
            type: 'boolean',
            description: 'Can this property support an independent guest entrance per N10? True = yes with renovation, False = not without major structural change.',
          },
          guest_separation_notes: {
            type: 'string',
            description: 'Why guest separation is or is not feasible. What needs to happen if renovation is required.',
          },
          guest_separation_cost_min: {
            type: 'integer',
            description: 'Minimum additional cost (euros) to achieve guest separation. 0 if already feasible with minimal work.',
          },
          guest_separation_cost_max: {
            type: 'integer',
            description: 'Maximum additional cost (euros) to achieve guest separation.',
          },
          voltage_concerns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Any voltage/electrical compatibility concerns for foreign buyers (e.g., 220V/50Hz vs US 110V/60Hz). Empty array if none.',
          },
          renovation_complexity: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'very_high'],
            description: 'Overall renovation complexity assessment.',
          },
          key_risks: {
            type: 'array',
            items: { type: 'string' },
            description: '3–6 key risks that could derail the project or significantly increase cost. Be specific.',
          },
          key_opportunities: {
            type: 'array',
            items: { type: 'string' },
            description: '3–5 genuine opportunities or positive features. Be specific.',
          },
        },
      },
      regulatory: {
        type: 'object',
        required: [
          'str_zoning',
          'str_zoning_notes',
          'change_of_use',
          'change_of_use_notes',
          'building_permits',
          'building_permits_notes',
          'landscape_protection',
          'landscape_protection_notes',
          'seismic_risk',
          'animals_permitted',
          'animals_notes',
          'septic_water',
          'septic_water_notes',
          'fire_safety',
          'fire_safety_notes',
          'business_classification',
          'business_classification_notes',
          'tax_regime_risk',
          'tax_regime_notes',
          'overall_risk',
          'agriturismo_eligible',
          'agriturismo_path_notes',
        ],
        properties: {
          str_zoning: { type: 'string', enum: ['red', 'yellow', 'green'] },
          str_zoning_notes: {
            type: 'string',
            description: 'Is short-term rental (Airbnb/locazione turistica) permitted in this commune/zone?',
          },
          change_of_use: { type: 'string', enum: ['red', 'yellow', 'green'] },
          change_of_use_notes: {
            type: 'string',
            description: 'Does the property need a change-of-use permit (cambio di destinazione d\'uso) for residential or hospitality use?',
          },
          building_permits: { type: 'string', enum: ['red', 'yellow', 'green'] },
          building_permits_notes: {
            type: 'string',
            description: 'Risk of unregistered structures (abusi edilizi) or outstanding permit issues.',
          },
          landscape_protection: { type: 'string', enum: ['red', 'yellow', 'green'] },
          landscape_protection_notes: {
            type: 'string',
            description: 'Vincolo paesaggistico (D.Lgs 42/2004) risk — exterior changes, new structures, solar panels.',
          },
          seismic_risk: { type: 'string', enum: ['red', 'yellow', 'green'] },
          animals_permitted: { type: 'string', enum: ['red', 'yellow', 'green'] },
          animals_notes: {
            type: 'string',
            description: 'Can the property keep chickens, goats, or other animals? Zoning requirements.',
          },
          septic_water: { type: 'string', enum: ['red', 'yellow', 'green'] },
          septic_water_notes: {
            type: 'string',
            description: 'Septic system (fossa biologica) condition risk, connection to public water/sewer.',
          },
          fire_safety: { type: 'string', enum: ['red', 'yellow', 'green'] },
          fire_safety_notes: {
            type: 'string',
            description: 'CPI (Certificato di Prevenzione Incendi) requirements for commercial hospitality use.',
          },
          business_classification: { type: 'string', enum: ['red', 'yellow', 'green'] },
          business_classification_notes: {
            type: 'string',
            description: 'Agriturismo vs locazione turistica vs B&B classification requirements and risk.',
          },
          tax_regime_risk: { type: 'string', enum: ['red', 'yellow', 'green'] },
          tax_regime_notes: {
            type: 'string',
            description: 'IMU classification risk, cedolare secca eligibility, agriturismo flat-rate regime.',
          },
          overall_risk: {
            type: 'string',
            enum: ['red', 'yellow', 'green'],
            description: 'MUST be red if any category is red. Otherwise worst of all category scores.',
          },
          agriturismo_eligible: {
            type: 'boolean',
            description: 'Is this property eligible for agriturismo classification based on land, features, and intent?',
          },
          agriturismo_path_notes: {
            type: 'string',
            description: 'Recommended regulatory path (agriturismo vs locazione turistica) and key requirements.',
          },
        },
      },
    },
  },
};
