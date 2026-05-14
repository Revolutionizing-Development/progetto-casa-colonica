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
| N6 | Renderings must reflect user's configured renovation scope |
| N7 | Minimum two renovation scenarios per property (Basic + Lifestyle) |
| N8 | All AI estimates visually labeled as estimates with confidence level |
| N9 | Every invoice checked for tax eligibility before recording |
| N10 | Guest apartments physically separated — independent entrances, no sightlines |
| N11 | No smoking anywhere on property — templated into all listings |

---

## Architecture

### Key Design Decisions

- **i18n from day one** — `next-intl` with `[locale]` prefix (en/it). All UI strings, all AI outputs.
- **Desktop-primary** — responsive but not mobile-first.
- **Server Components by default** — client components only when interactivity requires.
- **Mapbox GL JS** — real interactive maps, not illustrations. Zone overlays as GeoJSON.
- **GPT Image 2** — Phase 2. Best for architectural compositions with inpainting support.
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
│   ├── config/{permissions,regions,zones,tax-bonuses,defaults}.ts
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
