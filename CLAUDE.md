# CLAUDE.md — Progetto Casa Colonica

## What This Is

**Progetto Casa Colonica** is a SaaS platform for Italian farmhouse acquisition and renovation feasibility. It answers one question: *"Can this specific rural Italian property become the life/business compound I want — without blowing the budget, violating regulations, ruining the guest experience, or destroying the investment case?"*

It is NOT a real estate listing app. It is NOT a generic renovation calculator. It is an Italy-specific feasibility analyzer, investment decision tool, AI-powered visual rendering engine, tax-aware cost tracking system, and remote renovation management companion.

**Stack:** Next.js 14+ (App Router) · Clerk · Supabase (Postgres + Storage) · Aditus · Claude API · OpenAI GPT Image 2 · Mapbox GL JS · Tailwind CSS

---

## IAM — Aditus

This project uses `@revolutionizing-development/aditus` for all identity, authorization, lifecycle, metering, and audit concerns.

**Do not implement any of the following yourself:**
- Authorization checks (use `checkAccess`)
- User status logic (use the state machine via admin actions)
- AI budget enforcement (use `checkBudget` / `recordUsage`)
- Audit logging (use `writeAuditLog` + the named builder functions)
- Admin actions (approve, revoke, setTier, etc.)

### What this app owns

| Responsibility | Where |
|---|---|
| Token verification | `lib/auth.ts` — Clerk SDK |
| Adapter instantiation | `lib/stores.ts` — `createPostgresAdapter(pool)` |
| Permission matrix | `config/permissions.ts` — `PermissionMatrix` |
| DB migration | `scripts/migrate.ts` — `getMigrationSql()` run once on startup |

### The boundary

Aditus receives a **verified uid** and a **UserStore**. It never touches tokens, login UI, or the database directly. Everything else is the app's job.

### Required pattern — every protected route

```typescript
import { checkAccess } from '@revolutionizing-development/aditus';
import { stores } from '../lib/stores';
import { matrix } from '../config/permissions';

const decision = await checkAccess(uid, 'action:name', { stores: stores.user, matrix });
if (!decision.allowed) {
  return Response.json({ error: decision.reason }, { status: 403 });
}
```

### Required pattern — every AI route (after checkAccess)

```typescript
import { createMeteringMiddleware } from '@revolutionizing-development/aditus';

const metering = createMeteringMiddleware(stores, matrix);
const budget = await metering.checkBudget(uid, 'ai:analyze-property');
if (!budget.allowed) {
  return Response.json({ error: budget.reason, resetsAt: budget.resetsAt }, { status: 429 });
}
// ... make AI call ...
await metering.recordUsage(uid, { requests: 1, inputTokens, outputTokens }, budget.periodKey);
```

### Installing

```bash
npm install @revolutionizing-development/aditus
```

Add to `.npmrc`:
```
@revolutionizing-development:registry=https://npm.pkg.github.com
```

CI needs `NODE_AUTH_TOKEN` set to a PAT with `read:packages` scope.

---

## Constitution (Non-Negotiable Principles)

The full constitution lives in `docs/constitution-v1.1.md`. These are the principles that override every implementation decision.

### Hard Non-Negotiables

| # | Rule |
|---|------|
| N1 | No income projections before renovation completes |
| N2 | No renovation estimate without 15-25% contingency |
| N3 | Red regulatory flag = cannot receive "Strong Candidate" regardless of other scores |
| N4 | No DIY toggle on regulated work (electrical, structural, gas, seismic) |
| N5 | No financial model without carrying costs during renovation |
| N6 | Renderings use image editing (inpainting), NEVER text-to-image generation. Original photo is the canvas — camera angle, building footprint, and surroundings cannot change. Only renovation elements are modified. Displayed in before/after slider. |
| N7 | Minimum two renovation scenarios per property (Basic + Lifestyle) |
| N8 | All AI estimates visually labeled as estimates with confidence level |
| N9 | Every invoice checked for tax eligibility before recording |
| N10 | Guest apartments physically separated — independent entrances, no sightlines |
| N11 | No smoking anywhere on property — templated into all listings |
| N12 | Financial model defaults to operating P&L, not investment break-even |
| N13 | Requirements doc updated in the same session as any feature implementation |

---

## Architecture

### Key Design Decisions

- **i18n from day one** — `next-intl` with `[locale]` prefix (en/it). All UI strings, all AI outputs.
- **Desktop-primary** — responsive but not mobile-first.
- **Server Components by default** — client components only when interactivity requires.
- **Mapbox GL JS** — real interactive maps, not illustrations. Zone overlays as GeoJSON.
- **GPT Image 2** — Phase 2. Uses `images.edit()` (inpainting), NEVER `images.generate()`. Original uploaded photo is the canvas. Only renovation elements are modified. Camera angle, building footprint, and surroundings stay identical. Displayed in before/after slider component.
- **Monthly cash flow resolution** — not just annual. Renovation spend is lumpy.
- **Five income lines** — accommodation, wine tastings, cooking/pizza, farm experiences, olive oil. Not a single "Airbnb" line.
- **Confidence levels on all data** — Estimated → Quoted → Confirmed → Actual. Visual treatment differs per level.

### Project Structure

```
progetto-casa-colonica/
├── CLAUDE.md
├── docs/
│   ├── constitution-v1.1.md
│   └── requirements-v1.2.md
├── middleware.ts
├── src/
│   ├── app/[locale]/                     ← i18n routing
│   │   ├── layout.tsx                    ← ClerkProvider + next-intl
│   │   ├── page.tsx                      ← Landing (public)
│   │   ├── dashboard/page.tsx
│   │   ├── project/[id]/
│   │   │   ├── page.tsx                  ← Map + pipeline overview
│   │   │   ├── compare/page.tsx          ← Scoring matrix
│   │   │   └── criteria/page.tsx         ← Search criteria + weights
│   │   ├── property/[id]/
│   │   │   ├── page.tsx                  ← Hero rendering + map + tabs
│   │   │   ├── scenarios/page.tsx        ← Basic/Lifestyle/High-end
│   │   │   ├── scenarios/[sid]/page.tsx  ← Financial model
│   │   │   ├── costs/page.tsx            ← Cost tracking + tax
│   │   │   ├── costs/invoice/page.tsx    ← Invoice capture
│   │   │   ├── renderings/page.tsx
│   │   │   └── pipeline/page.tsx
│   │   ├── contacts/page.tsx
│   │   └── settings/page.tsx
│   ├── lib/
│   │   ├── auth.ts                       ← Clerk verification
│   │   ├── stores.ts                     ← Aditus adapter
│   │   ├── supabase/{client,server}.ts
│   │   ├── ai/{claude,openai-image,prompts/*,parsers/*}.ts
│   │   ├── financial/{model,diy-calculator,income-projection,operating-costs,tax-model,funding-sources,monthly-cashflow,roi-calculator,confidence,bonifico-generator}.ts
│   │   ├── scoring/{calculator,criteria,weights}.ts
│   │   ├── pipeline/{stages,transitions,gates}.ts
│   │   ├── regulatory/{assessment,agriturismo-path,land-thresholds}.ts
│   │   ├── farmstead/{livestock-costs,layout-conflicts,experience-income}.ts
│   │   └── checklists/operational.ts
│   ├── config/{permissions,regions,zones,tax-bonuses,defaults,cost-line-items}.ts
│   ├── components/{property,financial,costs,map,pipeline,project,upload,layout}/*.tsx
│   ├── types/{property,project,renovation,financial,invoice,scoring,rendering,pipeline,regulatory,farmstead,funding,contacts}.ts
│   └── i18n/{config,en.json,it.json}
├── supabase/migrations/001_initial_schema.sql
└── tests/
```

---

## Domain Rules

### Property Pipeline: 10 Stages

`scouted → analyzing → shortlisted → site_visit → negotiating → under_contract → closing → acquired → renovating → complete`

Invalid transitions throw. Every transition logs a `pipeline_events` row. Decision gates evaluate go/no-go criteria at key transitions.

### Financial Model: Per Scenario

Purchase costs → Renovation (DIY toggle) → Carrying costs (18-24 months) → Operating costs (incl. farmstead €3-6K/yr) → Tax model (Cedolare Secca + Bonus tracking) → Income (5 lines, corrected timeline) → Funding sources → Monthly cash flow → ARV → Confidence tracking.

### Tax Compliance

Bonifico parlante format: `"Ristrutturazione art. 16-bis DPR 917/1986 – Fatt. n. [NO] del [DATE] – [DESC] – CF: [CODICE_FISCALE] – P.IVA: [PARTITA_IVA]"`

Bonus caps (2026): Ristrutturazione 50%/36% max €96K. Ecobonus 50%/36% max €30-100K. Sismabonus 50%/36%. Mobili 50% max €5K. ENEA filing: 90 days after energy work completion.

### Scoring Matrix: 12 Criteria

Purchase Price 12%, All-in Cost 12%, Structure 12%, Airbnb Potential 12%, Regulatory Risk 12%, Lifestyle Fit 10%, Location 8%, Land 8%, Outbuildings 5%, Negotiation 5%, Exit Value 4%.

---

## Cost Engine — Line Item Structure

Every renovation estimate uses **quantity × unit cost × regional multiplier** per line item — not rough ranges per phase. Each item has a unit type (`€/m²`, `€/unit`, `€/lin.m`, `€/year`, `forfait`), a DIY labor percentage, a tax bonus tag, and a source tracker (`ai` | `manual` | `energy_driven` | `contractor_quote`).

Lifestyle & setup items are **toggleable on/off** with instant budget recalculation. Group toggles control child items. Mutually exclusive options use radio buttons. See `config/cost-line-items.ts` for the full item catalog.

### Regional Multipliers

```
Tuscany (Chianti/Florence): 1.25
Tuscany (southern/Maremma): 1.05
Umbria: 1.00 (baseline)
Lazio (northern): 0.92
Marche: 0.88
```

### Categories

**Structural & Envelope** (~14 items): roof cotto retile €110/m², roof timber replace €400/lin.m, roof insulation €50/m², walls repointing €130/m², walls plaster restore €55/m², walls insulation €85/m², seismic reinforcement €180/m², structural beam €380/lin.m, arch repair €2500/unit, foundation repair €300/lin.m, damp treatment €90/m², demolition €25/m², scaffolding €12/m²/month.

**Windows & Doors** (~6 items): wood double-glazed €1200/unit, heritage €1800/unit, shutters €450/unit, external door €2500/unit, internal door €650/unit, external staircase €4500 forfait.

**Systems** (~10 items): electrical full €65/m², plumbing full €80/m², bathroom rough-in €4500/unit, heat pump €14000 forfait, underfloor heating €75/m², radiators €450/unit, solar thermal €4000, septic €8000, ventilation MVHR €6000.

**Interior Finishes** (~12 items): kitchen custom €18000, kitchen Airbnb €8000, bathroom full €10000/unit, ensuite €7000/unit, flooring cotto €75/m², flooring oak €85/m², flooring restore €100/m², painting €20/m², plastering €45/m², fireplace restore €3000, staircase restore €6000.

**Guest Separation** (~5 items): independent entrance €4500/unit, soundproofing €45/m², privacy landscaping €2000, guest terrace €3500/unit, guest parking €1500.

**Energy** (~4 items): solar PV €1200/kW, battery €500/kWh, APE certification €400, ENEA filing €300.

**Vehicles & Equipment** (toggleable): SUV/4x4 €16000, second car €12000, car insurance €1200/year each, registration €500/unit, tractor/ATV €8000, horse trailer €6500, tools/workshop €3000, EV charger €2500.

**Swimming Pool** (toggleable group): concrete pool €55000 OR liner pool €42000 (radio), pool terrace €95/m², equipment €5000, annual maintenance €3300/year.

**Home Gym** (toggleable, mutually exclusive): in-house €8000 OR in-outbuilding €28000 OR separate build €64000 (radio). Equipment basic €3000 OR full €8000 (radio).

**Greenhouse & Growing** (toggleable): greenhouse 4×6m €4500, raised beds €2200, vines/grapes €200, compost €1000, irrigation 3-zone €1500.

**Perimeter & Security** (toggleable): stone walls €350/lin.m, iron gates €5500, perimeter fencing €35/lin.m, boar fencing €3500/hectare, cameras €2500, smart locks €2000, wifi mesh €1500.

**Outdoor Hospitality** (toggleable): courtyard paving €65/m², pergola €3000, pizza oven €4500, wine bar counter €1800, farmhouse table €1600, outdoor lighting €800, courtyard landscaping €1200, annual maintenance €1275/year.

**Livestock** (each toggleable): chickens (coop €3500, flock €200, annual €690/yr), goats (shelter €5000, paddock €2000, purchase €600, milking stand €300, annual €1550/yr), horses (stable €12000, paddock €4000, purchase €5000/unit, trailer €6500, annual €6000/yr per horse), dog (purchase €500, annual €1200/yr).

**Site Work**: driveway €5500, outdoor lighting €2500, rainwater cistern €4500, rainwater plumbing €1800, tree/cypress work €2500, landscape architect €4000.

**Transition & Setup** (toggleable): international move €8000, furniture main house €20000, furniture per Airbnb €6000/unit, appliances €5000, internet €500, health insurance Y1 €6000, food/living Y1 €10000, bureaucracy €1500, language tutoring €2500, return trips during build €2500, codice/residency €400.

**Professional Fees**: geometra 10% of construction, structural engineer €5000, energy consultant €400, notaio construction €1500, contingency 20% (mandatory N2).

### DIY Labor Percentages

Each line item has `diyLaborPercent` — the portion of cost that is labor, removed when DIY is toggled on:

```
demolition/clearing: 90%     greenhouse assembly: 70%
painting: 85%                 fencing: 65%
landscaping/garden: 80%       courtyard paving: 60%
raised beds: 80%              pergola: 55%
furniture assembly: 95%       stone walls: 50%
                              flooring cotto: 40%
                              plastering: 30%
LOCKED (0% — licensed):       pool construction: 0%
  electrical, plumbing,       structural: 0%
  gas/heating, seismic        roof timber structure: 0%
```

### Ongoing Operating Costs

Items marked `€/year` or `€/month` flow into the financial model's annual operating costs, which feed the operating P&L (per N12). Toggleable items only contribute when toggled on.

Additional ongoing items: pool maintenance €275/month, grounds labor (if hired) €1100/month, caretaker (if remote) €700/month, LPG gas (if not mains) €300/month, RAI TV licence €90/year.

---

## Build Priority

1. Database schema + RLS
2. Aditus integration (adapter, permissions, auth)
3. Types (all TypeScript types)
4. i18n setup (next-intl, en/it)
5. Project CRUD + search criteria
6. Property input (guided 9-step upload)
7. Claude analysis + regulatory assessment
8. Pipeline stages + decision gates
9. Renovation scenarios (Basic + Lifestyle generation)
10. Financial model (full: DIY, farmstead, 5-line income, monthly cash flow)
11. Scoring + comparison matrix
12. Map (Mapbox + zone overlays)
13. Cost tracking (invoice OCR, tax bonus, bonifico generator)
14. Budget vs actual + DIY savings
15. Commercialista export
16. Funding sources
17. Operational checklists
18. Renderings — GPT Image 2 (Phase 2)

---

## Rendering Rules (Per Constitution N6)

AI renderings use **image editing (inpainting)**, not text-to-image generation. The original uploaded photo is the canvas. The rendering modifies only what the renovation changes.

### API Pattern

```typescript
// WRONG — generates a new building from text
const response = await openai.images.generate({
  model: "gpt-image-2",
  prompt: "Restored Italian farmhouse..."
});

// RIGHT — edits the existing photo
const response = await openai.images.edit({
  model: "gpt-image-2",
  image: originalPhoto,      // user's uploaded before photo
  mask: renovationMask,      // auto-generated from renovation scope
  prompt: editPrompt,        // describes CHANGES, not a new building
});
```

### Rendering Rules

1. ALWAYS use `images.edit()`, NEVER `images.generate()`
2. The original uploaded photo is the canvas — camera angle cannot change
3. Prompt describes CHANGES to the existing building, not a description of a new building
4. Building footprint, number of structures, and surroundings are immutable
5. Mask only areas that renovation affects (roof, walls, windows, ground)
6. Auto-generate masks from renovation scope (roof work → mask roof surfaces, etc.)
7. Display in `BeforeAfterSlider.tsx` component, not as a standalone image
8. If the rendering changes the building shape or angle, it has failed — regenerate
9. Each uploaded photo angle (aerial, facade, interior) gets its own rendering
10. User's actual photos are always the "before" — never use stock or generated befores

### Prompt Format

```
Edit this [aerial/facade/interior] photo of [property description]. 
Keep the exact camera angle, building footprints, surrounding landscape 
unchanged. Make these specific modifications:

ROOF: [specific changes from renovation plan]
WALLS: [specific changes]
WINDOWS: [specific changes]
GROUNDS: [specific changes]

Maintain photorealistic quality matching the original photo's lighting.
```

### Before/After Slider Component

`components/rendering/BeforeAfterSlider.tsx` — draggable image comparison. Two image URLs (before + after), layered with CSS `clip-path` driven by slider position. Mouse drag + touch drag. "BEFORE"/"AFTER" labels in opposite corners. Defaults to 50% split. This is the hero component on the property detail page.

---

## Code Style

- TypeScript strict, no `any`
- React Server Components default; client only when needed
- Server Actions for mutations
- Zod for all external input validation
- Monetary values: integers in euros (€180,000 = 180000)
- Tailwind only
- Components: PascalCase. Utilities: kebab-case
- Named exports only (except Next.js page defaults)

---

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

No secrets in code. No `.env.local` committed.

---

## Testing

Unit tests for: scoring calculator, pipeline transitions, DIY calculator, income projection, bonifico generator, tax bonus categorization, land thresholds. Integration tests for Supabase queries. No unit tests for AI quality.

---

## Reference

- `docs/constitution-v1.1.md` — principles, non-negotiables
- `docs/requirements-v1.2.md` — features, user stories, data model

---

## Document Versions

**Check these versions at the start of every session.** If the version numbers here don't match the files in `docs/`, the docs have been updated — read the amendment log for what changed.

```
constitution:  v1.3   → docs/constitution.md
requirements:  v1.5   → docs/requirements.md
```

When the founder updates a document, they bump the version number above and drop the new file in `docs/`. The amendment log at the bottom of each document describes what changed. Read it before continuing work — it may affect what you're building.

---

## Documentation Maintenance (Per Constitution P15)

**The requirements document is part of the codebase.** When you implement a feature, update `docs/requirements-v1.2.md` in the same session:

- **Feature built:** Mark as implemented, note any deviations from the spec
- **Table added/changed:** Update the data model section to match the actual migration
- **Type changed:** Update the type definitions section
- **Feature descoped or deferred:** Move to the correct phase, add a note explaining why
- **New feature added during implementation:** Add user story, update MVP scope
- **Bug or design change:** Update the affected section with the actual behavior

**Format for change notes** (append to the amendment log at the bottom of the requirements doc):

```
| 1.2.x | [date] | [what changed] | [why] |
```

**Never let the requirements describe something the app doesn't do, or fail to describe something it does.**

---

## Financial Model Default (Per Constitution P14)

The financial model defaults to **Annual Operating P&L** — income vs running costs = net operating income. This answers "can I afford to live there?" not "when do I recoup my investment."

- **Primary view:** Operating P&L (income vs costs vs net)
- **Headline number:** Monthly net operating income (+€2,250–3,650/mo at stabilization)
- **Sustainability badge:** "Self-sustaining from Year 3" on property detail page
- **Investment break-even:** Secondary, collapsed toggle — never the default
- **Burn rate:** Shown during renovation phase (monthly carrying cost pre-income)
