export const ITALIAN_COSTS_CONTEXT = `
## Italian Construction Cost Baselines (2025-2026, Central Italy)

### Per-sqm Renovation Costs by Condition
- Full renovation (ruin): €1,200–€1,800/sqm
- Major renovation (fixer-upper): €800–€1,200/sqm
- Moderate renovation (habitable but dated): €400–€800/sqm
- Cosmetic refresh: €200–€400/sqm

### Regional Cost Multipliers
- Tuscany (Chianti, Florence area): 1.2–1.4×
- Tuscany (southern, Maremma): 1.0–1.1×
- Umbria: 0.9–1.0× (baseline)
- Lazio (northern): 0.85–0.95×
- Marche: 0.8–0.9×

### Italy-Specific Cost Items (must be included in every estimate)
- Seismic reinforcement (zone 2, central Italy): €150–€250/sqm
- Geometra (project management + permits): 8–12% of construction cost
- Structural engineer: €3,000–€6,000 per project
- Energy consultant (APE certification): €200–€500
- IVA on renovation: 10% (reduced rate for residential renovation)
- Scaffolding rental: €8–€15/sqm of facade per month

### Key Notes
- All monetary values in euros (integers)
- Apply the correct IVA rate (10% for residential renovation) to professional fees
- Geometra fees cover permitting (SCIA, DIA, or CILA), project management, and final certification
- Seismic compliance (zona sismica 2) is mandatory in central Italy — never omit
`.trim();

export function getRegionalMultiplier(region: string): { low: number; high: number } {
  const r = region.toLowerCase();
  if (r.includes('tuscany') || r.includes('toscana')) {
    if (r.includes('chianti') || r.includes('florence') || r.includes('firenze')) {
      return { low: 1.2, high: 1.4 };
    }
    return { low: 1.0, high: 1.1 };
  }
  if (r.includes('lazio')) return { low: 0.85, high: 0.95 };
  if (r.includes('marche')) return { low: 0.8, high: 0.9 };
  return { low: 0.9, high: 1.0 }; // Umbria baseline
}

export function getConditionCostRange(
  conditionCategory: string,
): { low: number; high: number } {
  switch (conditionCategory) {
    case 'ruin':
      return { low: 1200, high: 1800 };
    case 'major_renovation':
      return { low: 800, high: 1200 };
    case 'moderate_renovation':
      return { low: 400, high: 800 };
    case 'cosmetic':
    case 'habitable':
      return { low: 200, high: 400 };
    default:
      return { low: 800, high: 1200 };
  }
}
