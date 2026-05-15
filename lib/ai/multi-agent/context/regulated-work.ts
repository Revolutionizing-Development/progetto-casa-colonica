// Work categories that MUST be marked diyEligible: false per Constitution rule N4.
// Italian law requires licensed professionals for these — no exceptions.

export const REGULATED_WORK_CONTEXT = `
## Regulated Work — Must Be Marked NOT DIY-Eligible (Italian Law)

The following work categories REQUIRE a licensed professional under Italian law.
Every estimate MUST mark these as diyEligible: false with the exact legal reason.

| Category | Legal Requirement |
|----------|-------------------|
| Electrical | Dichiarazione di conformità required — licensed electrician (elettricista abilitato) |
| Gas connections | Licensed gas installer (installatore gas abilitato) — D.M. 37/2008 |
| Structural work | Licensed structural engineer (ingegnere strutturista) — seismic compliance |
| Plumbing (final sign-off) | Licensed plumber certification — D.M. 37/2008 |
| Roof structural work | Licensed contractor (impresa edile) required |
| Asbestos removal | Specialized certified firm (ditta specializzata amianto) — D.Lgs. 81/2008 |
| Seismic reinforcement | Licensed structural engineer + municipal approval |
| APE energy certificate | Certified energy consultant (certificatore energetico abilitato) |

Note: Cosmetic tile work, painting, landscaping, and kitchen/bathroom fitout
(excluding plumbing final certification) may be DIY-eligible.
`.trim();

export interface RegulatedWorkItem {
  keywords: string[];
  reason: string;
}

// Used by compliance checker to detect regulated items that were wrongly marked DIY
export const REGULATED_WORK_ITEMS: RegulatedWorkItem[] = [
  {
    keywords: ['electrical', 'electric', 'wiring', 'impianto elettrico'],
    reason: 'Dichiarazione di conformità required — licensed electrician (D.M. 37/2008)',
  },
  {
    keywords: ['gas', 'boiler', 'caldaia', 'heating system'],
    reason: 'Licensed gas installer required — D.M. 37/2008',
  },
  {
    keywords: ['structural', 'strutturale', 'seismic', 'sismico', 'foundation'],
    reason: 'Licensed structural engineer required — seismic zone 2 compliance',
  },
  {
    keywords: ['plumbing', 'idraulico', 'plumber'],
    reason: 'Licensed plumber certification required — D.M. 37/2008',
  },
  {
    keywords: ['roof structure', 'tetto strutturale', 'roof beam', 'travi tetto'],
    reason: 'Licensed contractor required for structural roof work',
  },
  {
    keywords: ['asbestos', 'amianto'],
    reason: 'Specialized certified firm required — D.Lgs. 81/2008',
  },
  {
    keywords: ['energy certificate', 'ape', 'certificazione energetica'],
    reason: 'Certified energy consultant required',
  },
];

export function isRegulatedWork(description: string): string | null {
  const lower = description.toLowerCase();
  for (const item of REGULATED_WORK_ITEMS) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item.reason;
    }
  }
  return null;
}
