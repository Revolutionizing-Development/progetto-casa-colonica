export const FARM_FEATURES_CONTEXT = `
## Farm Feature Cost Defaults (Central Italy, 2025-2026)

Include these as explicit FarmFeature line items when the buyer's intended
farm features include any of the following:

| Feature | Setup Cost | Annual Ongoing |
|---------|-----------|----------------|
| Chicken coop + run (10–15 birds) | €3,000–€5,000 | €510–€870/year |
| Goat shelter + paddock (3–4 animals) | €4,500–€7,000 | €1,130–€1,970/year |
| Pizza oven (forno a legna) | €4,000–€8,000 | €700–€1,300/year |
| Wine courtyard (pergola, table, lighting, bar, landscaping) | €8,000–€14,000 | €850–€1,700/year |
| Solar PV (6–10 kW ground mount) | €6,000–€12,000 | €0 (generates income) |
| Boar fencing (Umbria/Tuscany) | €3,500/hectare | varies |

Notes:
- Chicken coops under 30sqm typically do not require permits in rural zones
- Goat shelters may require agricultural building permit (autorizzazione edilizia)
- Pizza ovens installed in covered outdoor structures may require SCIA
- Solar PV ground mounts in agricultural zones require specific permit (autorizzazione paesaggistica in protected areas)
`.trim();

export interface FarmFeatureDefault {
  featureKey: string;
  displayName: string;
  setupCost: { low: number; high: number };
  annualOngoingCost: { low: number; high: number };
  diyEligible: boolean;
  description: string;
}

export const FARM_FEATURE_DEFAULTS: Record<string, FarmFeatureDefault> = {
  chickens: {
    featureKey: 'chicken_barn',
    displayName: 'Chicken coop + run (10–15 birds)',
    setupCost: { low: 3000, high: 5000 },
    annualOngoingCost: { low: 510, high: 870 },
    diyEligible: true,
    description:
      'Chicken coop and enclosed run for 10–15 laying hens. DIY construction eligible for rural zones under 30sqm.',
  },
  goats: {
    featureKey: 'goat_barn',
    displayName: 'Goat shelter + paddock (3–4 animals)',
    setupCost: { low: 4500, high: 7000 },
    annualOngoingCost: { low: 1130, high: 1970 },
    diyEligible: false,
    description:
      'Goat shelter and secure paddock. Agricultural building permit (autorizzazione edilizia) required.',
  },
  pizza_oven: {
    featureKey: 'pizza_oven',
    displayName: 'Forno a legna (wood-fired pizza oven)',
    setupCost: { low: 4000, high: 8000 },
    annualOngoingCost: { low: 700, high: 1300 },
    diyEligible: true,
    description:
      'Traditional wood-fired oven. Covered structure may require SCIA; freestanding outdoor units typically exempt.',
  },
  wine_courtyard: {
    featureKey: 'wine_courtyard',
    displayName: 'Wine courtyard (pergola, bar, landscaping)',
    setupCost: { low: 8000, high: 14000 },
    annualOngoingCost: { low: 850, high: 1700 },
    diyEligible: true,
    description:
      'Pergola with outdoor dining, bar setup, ambient lighting, and landscaping. Pergola over 20sqm may require CILA.',
  },
  solar: {
    featureKey: 'solar_pv',
    displayName: 'Solar PV system (6–10 kW)',
    setupCost: { low: 6000, high: 12000 },
    annualOngoingCost: { low: 0, high: 0 },
    diyEligible: false,
    description:
      'Ground-mount solar PV. Requires licensed electrician (dichiarazione di conformità) and grid connection approval from the local distributor.',
  },
  garden: {
    featureKey: 'kitchen_garden',
    displayName: 'Kitchen garden (orto)',
    setupCost: { low: 800, high: 2500 },
    annualOngoingCost: { low: 300, high: 700 },
    diyEligible: true,
    description: 'Raised beds, irrigation, compost system. Fully DIY-eligible.',
  },
  orchard: {
    featureKey: 'orchard',
    displayName: 'Fruit orchard',
    setupCost: { low: 2000, high: 5000 },
    annualOngoingCost: { low: 400, high: 1000 },
    diyEligible: true,
    description:
      'Mixed fruit trees (olives, figs, citrus). No permits required for tree planting in rural zones.',
  },
};
