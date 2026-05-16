# Progetto Casa Colonica — Requirements v1.1

**Product:** Progetto Casa Colonica — Rural Italian Property Feasibility Platform
**Type:** SaaS · Multi-tenant · Desktop-primary
**Stack:** Next.js 14+ · Clerk · Supabase (Postgres + Storage) · Aditus (`@revolutionizing-development/aditus`)
**AI:** Claude API (analysis, estimates, comparison) · OpenAI GPT Image 2 (visual renderings)
**Scope:** Italian farmhouse acquisition, renovation feasibility, and tax-aware cost tracking
**Localization:** English + Italian (i18n from day one)
**Companion docs:** Constitution v1.1 · CLAUDE.md

---

## 1. Product Vision

### 1.1 The One Question

"Can this specific rural Italian property become the life/business compound I want — without blowing the budget, violating regulations, ruining the guest experience, or destroying the investment case?"

### 1.2 The Problem

Buying and renovating a rural Italian farmhouse for combined living and hospitality use is a multi-year, €500K+ project that currently lives across browser bookmarks, WhatsApp threads, spreadsheets, and gut feeling. Foreign buyers lack tools to objectively compare properties, model renovation scenarios, understand regulatory constraints, visualize outcomes, track costs against budget, or properly document expenses for Italian tax deductions worth up to €48,000.

### 1.3 The Solution

A single platform combining AI-powered feasibility analysis, visual rendering, investment modeling, regulatory risk assessment, and tax-aware cost tracking. The platform guides buyers from first listing discovery through renovation completion, protecting tens of thousands in tax deductions along the way.

### 1.4 The Two Value Propositions

**Pre-acquisition:** Make better property decisions through AI analysis, multi-scenario comparison, and regulatory risk scoring. Avoid buying a property that can't support the intended use.

**Post-acquisition:** Protect up to €48,000 in Italian tax deductions through proper invoice documentation, bonifico parlante generation, tax bonus categorization, and deadline tracking. Track budget vs actual spend with DIY savings confirmation.

### 1.5 Who Uses This

**Primary:** English-speaking buyers searching for Italian farmhouses from abroad (US, UK, Northern Europe, Australia). Buying remotely, managing renovation from a distance for 12-24 months.

**Secondary:** Relocation consultants, geometras, and bilingual agents advising foreign buyers.

**Tertiary:** Italian property investors targeting agriturismo/Airbnb.

---

## 2. Architecture Boundaries

### 2.1 Out of Scope — Aditus (`@revolutionizing-development/aditus`)

**Do not implement any of the following in this application:**
- Authorization checks (use `checkAccess`)
- User status logic (use the state machine via admin actions)
- AI budget enforcement (use `checkBudget` / `recordUsage`)
- Audit logging (use `writeAuditLog` + the named builder functions)
- Admin actions (approve, revoke, setTier, etc.)

**What this app owns:**

| Responsibility | Where |
|---|---|
| Token verification | `lib/auth.ts` — Clerk SDK |
| Adapter instantiation | `lib/stores.ts` — `createPostgresAdapter(pool)` |
| Permission matrix | `config/permissions.ts` — app-specific tiers and AI actions |
| DB migration | `scripts/migrate.ts` — `getMigrationSql()` run once on startup |

**The boundary:** Aditus receives a verified `uid` and a `UserStore`. It never touches tokens, login UI, or the database directly.

**Required pattern — every protected route:**
```typescript
import { checkAccess } from '@revolutionizing-development/aditus';
import { stores } from '../lib/stores';
import { matrix } from '../config/permissions';

const decision = await checkAccess(uid, 'action:name', { stores: stores.user, matrix });
if (!decision.allowed) {
  return Response.json({ error: decision.reason }, { status: 403 });
}
```

**Required pattern — every AI route (after checkAccess):**
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

**Installing:**
```
npm install @revolutionizing-development/aditus
```
Add to `.npmrc`:
```
@revolutionizing-development:registry=https://npm.pkg.github.com
```
CI needs `NODE_AUTH_TOKEN` set to a PAT with `read:packages` scope.

### 2.2 In Scope — This Application

Property domain, AI analysis, visual rendering, scoring matrix, regulatory risk, renovation scenarios, financial model (DIY/tax/residency toggles), income projection, cost tracking with tax compliance, acquisition pipeline, farmstead layout intelligence, and all UI.

---

## 3. Domain Model

### 3.1 Core Entity Graph

```
User (via Aditus)
 └── Projects (project_type: farmstead_hosting | private_homestead)
      ├── SearchCriteria
      ├── ScoringWeights (type-aware: 11 keys hosting, 8 keys homestead)
      ├── Properties
      │    ├── ListingData
      │    ├── AIAnalysis
      │    ├── RegulatoryAssessment
      │    ├── EnergyAssessment
      │    ├── LayoutAssessment
      │    ├── ScoringResult
      │    ├── RenovationScenarios (basic/lifestyle/high-end/custom)
      │    │    ├── Phases → LineItems (DIY toggle per item)
      │    │    ├── ScopeToggles (JSONB)              ← NEW (1.2.17)
      │    │    ├── PhaseAssignments (JSONB)           ← NEW (1.2.17)
      │    │    ├── FarmFeatures
      │    │    ├── FinancialModel
      │    │    │    ├── PurchaseCosts
      │    │    │    ├── RenovationCosts (contractor + DIY variant)
      │    │    │    ├── CarryingCosts
      │    │    │    ├── OperatingCosts
      │    │    │    ├── TaxModel (Cedolare Secca toggle)
      │    │    │    ├── IncomeProjection (Y0-Y5+)
      │    │    │    ├── CurrencyExposure
      │    │    │    ├── CashFlowTimeline
      │    │    │    └── ROISummary
      │    │    └── ARVEstimate
      │    ├── Invoices                          ← NEW (core)
      │    │    ├── OCR extracted data
      │    │    ├── Tax bonus categorization
      │    │    ├── Bonifico parlante text
      │    │    ├── Payment verification status
      │    │    └── Budget line item match
      │    ├── TaxDeductionTracker               ← NEW (core)
      │    │    ├── Per-bonus spending caps
      │    │    ├── 10-year deduction schedule
      │    │    ├── ENEA deadline tracking
      │    │    └── Commercialista export
      │    ├── DIYSavingsTracker                 ← NEW (core)
      │    ├── Renderings (GPT Image 2)
      │    ├── AcquisitionTracker
      │    │    ├── PipelineEvents
      │    │    ├── Documents
      │    │    ├── Offers
      │    │    └── SiteVisitTrips
      │    ├── Notes
      │    └── Photos
      ├── DIYProfiles (project-level, per user)  ← NEW (1.2.18)
      ├── ComparisonMatrix
      └── Contacts
  HouseholdProfile (user-level, one per user)    ← NEW (1.2.21)
      ├── partner_income, partner_income_location
      ├── impatriat_eligible
      ├── starting_cash, monthly_savings_rate
      ├── us_phase_months, diy_phase_months
      ├── move_date, annual_living_costs, adults
      └── Flows into all project financial models
```

### 3.2 Property Pipeline Stages

```
Scouted → Analyzing → Shortlisted → Site Visit → Negotiating → Under Contract → Closing → Acquired → Renovating → Complete
```

### 3.3 Renovation Scenario Types

| Scenario | Description | Typical Budget (600 sqm) |
|----------|-------------|-------------------------|
| Basic | Safe, livable, minimal guest accommodation. | €200K–€350K |
| Lifestyle | Strong guest experience, courtyard, good finishes, farm features. | €350K–€550K |
| High-end | Premium destination, high finishes, landscaping, wellness/pool. | €550K–€900K+ |
| Custom | User-defined scope. | Variable |

### 3.4 Project Types

Every project must be typed at creation time. The type is immutable after creation and cascades through the entire analysis pipeline.

| Type | Slug | Description |
|------|------|-------------|
| Farmstead + Hosting | `farmstead_hosting` | Airbnb apartments, agriturismo, experiences, full scope with income projections. Default. |
| Private Homestead | `private_homestead` | No guests, no income — simpler renovation scope, personal use only. |

**Cascade effects of `private_homestead`:**

- **Scoring:** 8 criteria instead of 11 — drops `airbnb_potential`, `outbuilding_potential`, `negotiation_margin`. Remaining weights redistributed (purchase_price 15%, all_in_cost 15%, structural_condition 15%, regulatory_risk 14%, lifestyle_fit 15%, location_quality 10%, land_characteristics 10%, exit_value 6%).
- **AI analysis:** Guest separation set to N/A. STR zoning, agriturismo eligibility deprioritized. Tax regime evaluates prima casa instead of cedolare secca.
- **AI scenarios:** No guest accommodation in lifestyle scenario. No income-generating outbuilding conversions. Farm features for personal use only.
- **Cost engine:** `guest_separation` category excluded. Airbnb-specific line items (`kitchen_airbnb`, `furniture_airbnb`) excluded.
- **Timeline:** No "Airbnb go-live" gate. No guest-separation or airbnb-fitout phases.
- **Financial model:** `annualPropertyIncome = 0`. Comparison metrics show privacy as "Complete" instead of "Scheduled".
- **Search criteria:** Hides "Must be Agriturismo eligible" checkbox.
- **Project comparison:** Uses project type instead of scenario type to determine hosting vs non-hosting metrics.

**Migration:** `docs/migration-021-project-type.sql` — adds `project_type TEXT NOT NULL DEFAULT 'farmstead_hosting'` with CHECK constraint.

---

## 4. Feature Modules

### 4.1 Property Intake (Guided Upload)

9-step guided photo wizard with completeness scoring. Full-res individual photos, not PDFs. Required/Recommended/Optional badges. Smart prompts for missing items. Confidence level display.

### 4.2 AI Analysis Engine (Claude API)

| Action | Output |
|--------|--------|
| ai:analyze-property | AIAnalysis + RegulatoryAssessment |
| ai:generate-scenarios | Basic + Lifestyle + optional High-end |
| ai:estimate-renovation | Phased budget with line items |
| ai:assess-regulatory | Red/yellow/green risk scoring |
| ai:assess-layout | Spatial conflict warnings |
| ai:assess-energy | Energy upgrade path + cost |
| ai:compare-properties | Narrative comparison (2-3 properties) |
| ai:refine-estimate | Recalculate after scope change |
| ai:estimate-arv | After-repair value assessment |

### 4.3 Visual Rendering Engine (OpenAI GPT Image 2)

Types: exterior_front, exterior_rear, courtyard, interior_living, interior_kitchen, interior_airbnb, aerial. Built dynamically from renovation scenario + farm features + property characteristics. Before/After/Progress toggle. Inpainting support. Phase 2.

### 4.4 Regulatory Risk Module

10 assessment categories with red/yellow/green scoring: STR zoning, change of use, building permits, landscape protection, seismic zone, animals, septic/water, fire/safety, business classification, tax regime. Overall risk score feeds into decision scorecard. Per Constitution N3: red flag = cannot receive "Strong Candidate" rating.

### 4.5 Financial Model

Complete investment picture per renovation scenario. Includes: purchase costs (with notaio, agency, mortgage tax), renovation costs (with 3-level DIY toggle), carrying costs during 18-24 month renovation, operating costs post-renovation (including farmstead ongoing costs), Cedolare Secca tax toggle (21%/26% flat vs progressive up to 43%), income projection (corrected timeline: Y0-Y1 zero income, Y2 partial, Y3 ramp-up, Y4+ stabilized), currency exposure tracking (USD→EUR tranches), residency status toggle (IMU impact), cumulative cash flow valley chart, ARV estimator, confidence tracking (estimated → quoted → confirmed → actual).

**Farmstead ongoing costs (annual, included in operating expenses):**

| Item | Annual Cost | DIY Level | Notes |
|------|-----------|-----------|-------|
| Chickens (10-15 birds) | €510–€870 | High | Feed, bedding, vet. ~30 min/day DIY. Egg offset ~€1,260/yr value. |
| Goats (3-4 animals) | €1,130–€1,970 | High | Feed, hay, vet, hoof trimming. ~45 min/day DIY. Milk/cheese value. |
| Pizza oven operation | €700–€1,300 | Full | Wood, maintenance, guest event ingredients. "Pizza night" = premium Airbnb experience. |
| Courtyard maintenance | €850–€1,700 | Full | Plants, lighting, furniture care, wine for tastings. |
| **Total farmstead ops** | **€3,190–€5,840** | | **Adds €270–€490/month to operating costs. ~1.5–2 hrs/day DIY.** |

These costs are toggleable per farm feature — if you remove goats from the scenario, the operating cost drops accordingly. The financial model recalculates income projections when farmstead costs change.

**Default financial view: Annual Operating P&L (not investment break-even)**

The financial model defaults to showing annual operating income vs annual operating costs. This answers the question buyers actually ask: "Can I afford to live there?" not "When do I recoup my investment." The purchase + renovation is an asset acquisition — the buyer owns a €700K+ property. The operating P&L tells them whether it sustains itself.

| View | Display | Priority |
|------|---------|----------|
| **Operating P&L (default)** | Annual income (5 lines) vs annual operating costs = net operating income | Primary — always visible |
| **Monthly operating cash flow** | Net income per month (€2,250–3,650/mo at stabilization) | Primary — headline number |
| **Sustainability indicator** | "Self-sustaining from Year 3" green badge | Primary — on property detail page |
| **Burn rate** | Monthly cost during renovation (pre-income period) | Primary — during renovation phase |
| Investment break-even | "~18 years from rental income only" | Secondary — collapsed toggle |
| Investment break-even with appreciation | "~8 years including 3-5% annual appreciation" | Secondary — collapsed toggle |
| Asset value tracker | Current estimated property value (purchase + renovation + appreciation) | Secondary — collapsed toggle |

**Operating break-even is Year 3** — the year annual income first exceeds annual operating costs. This is the number that matters, not the 18-year investment payback.

### 4.6 Cost Tracking & Tax Compliance — ELEVATED TO MVP

**Purpose:** Track every euro spent during renovation, protect tax deductions, confirm DIY savings, and prepare tax-ready documentation for the commercialista.

**Value:** Up to €48,000 in tax deductions on a primary residence renovation (€34,560 for second homes). One improperly documented payment = permanently lost deduction.

#### 4.6.1 Invoice Capture

**Flow:** Snap photo → AI extracts data via OCR → auto-match to budget → tag tax bonus → generate bonifico text → save.

**OCR extraction fields:**
- Vendor name and legal entity
- Partita IVA (contractor VAT number)
- Invoice number (fattura number)
- Invoice date
- Amount excluding IVA
- IVA rate (10% reduced for renovation / 22% standard)
- IVA amount
- Total amount
- Description of work/materials

**After extraction:** User confirms or corrects. System validates Partita IVA format. Stores original photo + extracted structured data.

#### 4.6.2 Budget Line Item Matching

Each invoice is matched to a renovation phase and line item:
- Auto-suggestion based on description keywords
- User confirms or reassigns
- Running total per line item: budget estimate → actual spend → variance
- Phase-level rollup: budget vs actual with over/under indicator

#### 4.6.3 Tax Bonus Categorization

Each invoice is tagged with applicable Italian tax bonus:

| Bonus | 2026 Rate (Primary) | 2026 Rate (Second Home) | Max Eligible Spend | Deduction Period |
|-------|---------------------|------------------------|-------------------|-----------------|
| Bonus Ristrutturazione | 50% | 36% | €96,000/unit | 10 years |
| Ecobonus | 50% | 36% | €30K–€100K by type | 10 years |
| Sismabonus (zone 2) | 50% | 36% | Special limits | 10 years |
| Bonus Mobili | 50% | — | €5,000 | 10 years |

System tracks cumulative spend per bonus against cap. Alerts when approaching cap. Shows remaining eligible spend.

**Auto-categorization logic:** Roof/structural work → Ristrutturazione. Heat pump/insulation/windows → Ecobonus. Seismic reinforcement → Sismabonus. Furniture for renovated property → Bonus Mobili. Materials purchased for DIY → Ristrutturazione (materials are deductible even for DIY).

#### 4.6.4 Payment Method Verification

Per Constitution N9: every invoice is checked for deductibility.

**Qualifying payments:**
- Bonifico parlante (special bank transfer with legal references) ✅
- Credit card ✅ (for Bonus Mobili)

**Non-qualifying payments:**
- Cash ❌
- Regular bank transfer (without legal references) ❌
- Check ❌

**Warning system:** When user marks an invoice as paid via cash or regular transfer, the system immediately warns: "This payment method does not qualify for tax deductions. The €X deduction on this invoice is permanently lost. Consider paying future invoices via bonifico parlante."

**Pre-payment warning (ideal flow):** User enters upcoming invoice BEFORE paying → system generates bonifico parlante text → user copies into their bank app → pays correctly → marks as paid → deduction secured.

#### 4.6.5 Bonifico Parlante Generator

For each qualifying invoice, the system generates the exact text string required for the bank transfer:

```
Ristrutturazione art. 16-bis DPR 917/1986 – Fatt. n. [INVOICE_NO] del [DATE] – [DESCRIPTION] – CF: [USER_CODICE_FISCALE] – P.IVA: [CONTRACTOR_PARTITA_IVA]
```

**Requirements captured from user profile:** Codice Fiscale (entered once in settings). For Ecobonus or Sismabonus, the legal reference changes accordingly.

**Copy-to-clipboard** button for easy paste into Italian bank's online banking.

#### 4.6.6 ENEA Deadline Tracking

Energy efficiency work (Ecobonus) must be reported to ENEA within 90 days of completion. The app:
- Tracks which renovation phases contain energy work
- Monitors phase completion dates
- Alerts when the 90-day ENEA filing window opens
- Warns when the deadline is approaching (30 days, 14 days, 7 days)
- Links to the ENEA submission portal
- Missing this deadline = losing the entire Ecobonus deduction on that work

#### 4.6.7 DIY Savings Tracker

Tracks confirmed savings from DIY work:
- Original AI estimate (contractor cost): materials + labor
- DIY estimate (materials only): from the DIY toggle in the financial model
- Actual materials spend: from invoices tagged as DIY materials
- Confirmed savings: contractor estimate minus actual materials spend
- Tax note: DIY materials receipts are still deductible via Bonus Ristrutturazione if paid by bonifico parlante

Running total: "You have saved €X by doing this work yourself" with the qualifier "€Y of your DIY materials spending is tax-deductible."

#### 4.6.8 Commercialista Export

Year-end export package for Italian tax filing:

| Export Item | Format | Content |
|-------------|--------|---------|
| Invoice bundle | PDF | All invoice photos + extracted data |
| Payment verification | CSV + PDF | Bonifico parlante records with confirmation |
| Expense summary by bonus | Spreadsheet | Categorized by Ristrutturazione / Ecobonus / Sismabonus / Mobili |
| 10-year deduction schedule | PDF | Annual installment amounts per bonus type |
| Cumulative cap tracker | PDF | Spend vs €96K cap per property unit |
| DIY materials receipts | PDF | Separated for deduction eligibility |
| ENEA filing status | PDF | Which work has been reported, deadlines met/missed |

**Export is structured for the commercialista's workflow** — they receive a complete, organized package rather than a shoebox of receipts.

#### 4.6.9 Budget vs Actual Dashboard

**Per phase:**
- Estimated range (from renovation scenario)
- Quoted amount (from contractor quotes, if entered)
- Actual spend (sum of matched invoices)
- Variance (over/under budget, percentage)
- DIY savings (if applicable)
- Deductions secured (tax value of qualifying expenses)

**Totals:**
- Overall budget vs actual
- Total deductions secured vs potential
- Total DIY savings confirmed
- Confidence meter: what percentage is based on actual invoices vs estimates

### 4.7 Scoring Matrix

12 criteria with configurable weights: Purchase Price (12%), All-in Cost (12%), Structural Condition (12%), Airbnb Potential (12%), Regulatory Risk (12%), Lifestyle Fit (10%), Location Quality (8%), Land Characteristics (8%), Outbuilding Potential (5%), Negotiation Margin (5%), Exit Value (4%).

### 4.8 Layout Intelligence

Rule-based spatial conflict warnings. Farmstead element relationships: animal zones vs guest areas, solar vs views, courtyard vs livestock, parking vs olive trees, guest entrance independence.

### 4.9 Energy Assessment

Full module: current energy class risk, insulation path, heat pump feasibility, window upgrades, solar PV sizing, Italian incentive programs, before/after energy cost comparison, payback period.

### 4.10 Pipeline & Acquisition Tracker

Kanban board, event timeline, offer tracking, document upload, contact management, site visit planner.

### 4.11 Guest Separation Requirements — NEW

**Purpose:** Ensure Airbnb apartments function as independent properties, not rooms in the owner's house. Per Constitution N10.

**Separation checklist (evaluated during AI analysis):**

| Requirement | Level | Description |
|-------------|-------|-------------|
| Independent entrances | Required | From courtyard or exterior — never through owner spaces |
| Separate outdoor seating | Required | Each apartment gets its own terrace/patio |
| No owner-guest sightlines | Required | Owner terrace cannot look directly onto guest terrace |
| Sound insulation | Required | Party walls and floors between owner wing and guest wing |
| Separate parking | Required | Guest parking area distinct from owner parking |
| Privacy landscaping | Recommended | Hedge, low wall, or plantings between zones |
| Separate utility meters | Recommended | Per-apartment electricity metering |
| Livestock screening | Required | Animal areas not visible from guest terraces or outdoor dining |
| Shared space scheduling | Design | Courtyard and pizza oven accessible to guests on scheduled basis, not ad-hoc |

**Renovation cost impact:** Independent entrances (€3–6K), sound insulation (€2–4K), privacy landscaping (€1–2K), guest parking (€0.8–1.5K), guest terraces (€2–4K per apartment). Total: €9–18K additional renovation cost for proper separation.

**AI analysis flag:** If the building layout cannot support independent guest entrances without major structural intervention, the AIAnalysis must flag this as a risk: "Guest entrance independence requires architectural intervention — verify feasibility with geometra before committing." This flag feeds into the Regulatory Risk score and the Lifestyle Fit criterion in the scoring matrix.

### 4.12 House Rules & Policies — NEW

**Purpose:** Define non-negotiable property policies that affect Airbnb listing templates, guest communications, and property operations.

**No-smoking policy (per Constitution N11):**
- Strict no-smoking everywhere on the property — inside, outside, terraces, courtyards, gardens, parking
- No exceptions, no designated smoking areas
- Templated into every Airbnb listing as the first house rule
- Included in booking confirmation communications
- Multilingual signage (Italian, English, German, French) — tasteful, consistent with property aesthetic
- Cleaning checklist includes smoke-smell verification at guest departure
- Damage deposit covers deep cleaning if policy is violated
- Positioned as a feature: "Smoke-free farmstead" appeals to families and wellness travelers

**Future house rules (configurable per property):**
- Check-in/check-out times
- Quiet hours
- Pet policy
- Maximum occupancy
- Pool/outdoor area hours (if applicable)
- Event/party policy

### 4.13 Location & Life Intelligence — NEW

**Purpose:** Per-property location analysis combining AI regulatory research, Mapbox distance/isochrone data, and community profiling. Answers: "Can I do what I want here?" and "What's it like to live here?"

**Tab:** "Location & Life" added to property page navigation (between Checklist and Pipeline).

**Data model:** `location_intelligence JSONB` column on `properties` table (migration 022). Stores:

| Field | Type | Source |
|-------|------|--------|
| `generated_at` | ISO timestamp | Server |
| `regulatory_checklist` | Array of `{ question, status, detail, source_hint }` | Claude AI |
| `distances` | Array of `{ category, name, drive_minutes, distance_km, lng, lat }` | Mapbox Geocoding + Directions |
| `community` | Object with 8 string fields | Claude AI |
| `isochrone_minutes` | `[10, 20, 30]` | Config |

**Sections:**

1. **Regulatory Feasibility Checklist** — AI-researched per commune. Each item has green/yellow/red status with detail and verification source hint. Questions vary by project type:
   - Farmstead + Hosting (10 questions): locazione turistica, agriturismo, cooking classes, alcohol service (somministrazione), chickens, goats, pool, solar panels, seismic classification, animals with guests.
   - Private Homestead (7 questions): chickens, goats, pool, solar panels, seismic classification, agricultural land restrictions, prima casa requirements.

2. **Distance Cards** — 7 categories via Mapbox Geocoding v5 (POI search) + Directions v5 (drive time/distance): supermarket, bakery, pharmacy, hospital, veterinarian, train station, airport. Color-coded by drive time (green ≤10min, amber ≤25min, red >25min).

3. **Community Profile** — AI-assessed: expat presence, demographics, language environment, local events, outdoor activities, cycling, internet connectivity, overall vibe (quoted one-liner).

4. **Accessibility Map** — Mapbox GL JS with:
   - Property marker (terracotta)
   - POI markers (olive-bordered circles) with popups showing name + drive time
   - 3 isochrone rings (10/20/30 min drive) via Mapbox Isochrone v1 API, terracotta-tinted fill with dashed borders
   - Legend bar below map

**API route:** `POST /api/ai/location-intelligence` (maxDuration 300s). Authenticates via Clerk. Three steps: (1) Claude AI analysis for regulatory + community, (2) Mapbox POI + distance lookup, (3) save combined JSONB to properties table.

**Key files:**
- Types: `src/types/location-intelligence.ts`
- AI prompt: `src/lib/ai/prompts/location-intelligence.ts`
- API route: `src/app/api/ai/location-intelligence/route.ts`
- Client component: `src/components/property/LocationLifePanel.tsx`
- Tab page: `src/app/[locale]/property/[id]/location/page.tsx`
- Migration: `docs/migration-022-location-intelligence.sql`

---

## 5. Data Model (Supabase Schema)

### 5.1 Core Tables

```sql
-- (Previous tables from v1.0 remain: projects, properties,
-- renovation_scenarios, pipeline_events, renderings, documents,
-- contacts, property_contacts, offers, site_visit_trips, notes,
-- currency_conversions)

-- INVOICES — Core cost tracking
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES renovation_scenarios(id),
  user_id TEXT NOT NULL,

  -- OCR extracted data
  vendor_name TEXT NOT NULL,
  vendor_partita_iva TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  amount_excl_iva INTEGER NOT NULL,       -- euros
  iva_rate NUMERIC,                        -- 0.10 or 0.22
  iva_amount INTEGER,                      -- euros
  total_amount INTEGER NOT NULL,           -- euros
  description TEXT,
  original_photo_url TEXT,                 -- Supabase Storage

  -- Budget matching
  phase_number INTEGER,
  line_item_key TEXT,
  is_diy_materials BOOLEAN DEFAULT FALSE,

  -- Tax compliance
  tax_bonus TEXT,                           -- ristrutturazione, ecobonus, sismabonus, mobili, none
  payment_method TEXT NOT NULL,             -- bonifico_parlante, credit_card, cash, regular_transfer
  is_tax_deductible BOOLEAN GENERATED ALWAYS AS (
    payment_method IN ('bonifico_parlante', 'credit_card')
    AND vendor_partita_iva IS NOT NULL
    AND tax_bonus IS NOT NULL
    AND tax_bonus != 'none'
  ) STORED,
  bonifico_text TEXT,                       -- generated payment description
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_date DATE,

  -- Metadata
  confidence_level TEXT DEFAULT 'confirmed', -- invoices are real data
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAX DEDUCTION TRACKING
CREATE TABLE tax_deduction_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Residency status affects rates
  is_primary_residence BOOLEAN DEFAULT FALSE,
  ristrutturazione_rate NUMERIC DEFAULT 0.36,  -- 0.50 if primary
  ecobonus_rate NUMERIC DEFAULT 0.36,
  sismabonus_rate NUMERIC DEFAULT 0.36,

  -- Cumulative caps (euros)
  ristrutturazione_cap INTEGER DEFAULT 96000,
  ristrutturazione_spent INTEGER DEFAULT 0,
  ecobonus_cap INTEGER DEFAULT 100000,
  ecobonus_spent INTEGER DEFAULT 0,
  sismabonus_cap INTEGER DEFAULT 96000,
  sismabonus_spent INTEGER DEFAULT 0,
  mobili_cap INTEGER DEFAULT 5000,
  mobili_spent INTEGER DEFAULT 0,

  -- ENEA tracking
  enea_work_completed_date DATE,
  enea_filing_deadline DATE,              -- computed: completed + 90 days
  enea_filed BOOLEAN DEFAULT FALSE,
  enea_filed_date DATE,

  -- User tax info
  codice_fiscale TEXT,                     -- for bonifico parlante generation

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DIY SAVINGS LOG
CREATE TABLE diy_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES renovation_scenarios(id),
  user_id TEXT NOT NULL,

  phase_number INTEGER,
  line_item_key TEXT NOT NULL,
  description TEXT NOT NULL,

  contractor_estimate INTEGER NOT NULL,    -- what it would have cost
  materials_actual INTEGER NOT NULL,       -- what you actually spent
  savings_amount INTEGER GENERATED ALWAYS AS (
    contractor_estimate - materials_actual
  ) STORED,

  materials_deductible BOOLEAN DEFAULT FALSE, -- paid via bonifico?
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Row-Level Security

All tables with user_id have RLS enabled. Users see only their own data.

---

## 6. User Stories — Cost Tracking

### Invoice Management

**US-100: Capture Invoice by Photo**
As a renovating owner, I want to snap a photo of an invoice and have the app extract vendor name, Partita IVA, amount, IVA rate, and description, so I don't have to type it all manually.

**US-101: Match Invoice to Budget**
As a renovating owner, I want each invoice auto-matched to the correct renovation phase and line item, so I can see budget vs actual per item without manual categorization.

**US-102: Manual Invoice Entry**
As a renovating owner, I want to enter invoice details manually when OCR fails or when I receive digital invoices, so every expense is tracked regardless of format.

### Tax Compliance

**US-110: Tax Bonus Auto-Categorization**
As a renovating owner, I want each invoice automatically tagged with the applicable Italian tax bonus (Ristrutturazione / Ecobonus / Sismabonus / Mobili) so I know which deductions I'm accumulating.

**US-111: Payment Method Warning**
As a renovating owner, I want to be warned immediately if I mark a payment as cash or regular transfer, because that means the deduction is permanently lost and I might still have time to pay correctly.

**US-112: Pre-Payment Bonifico Generator**
As a renovating owner, I want to enter an upcoming invoice BEFORE paying so the app generates the correct bonifico parlante text for me to copy into my bank, ensuring I pay correctly the first time.

**US-113: Spending Cap Monitor**
As a renovating owner, I want to see how much of my €96,000 Ristrutturazione cap I've used, so I know how much deductible spending remains.

**US-114: ENEA Deadline Alert**
As a renovating owner, I want to be alerted when my energy work is completed that I have 90 days to file with ENEA, because missing this deadline loses the entire Ecobonus deduction.

**US-115: Residency Status Impact**
As a renovating owner, I want to toggle between primary residence and second home status and see how it affects my deduction rates (50% vs 36%), so I can plan my residency declaration timing.

### Budget Tracking

**US-120: Budget vs Actual Dashboard**
As a renovating owner, I want to see estimated vs quoted vs actual spend per phase with variance indicators, so I catch overruns early.

**US-121: DIY Savings Confirmation**
As a renovating owner, I want to see confirmed DIY savings (contractor estimate minus actual materials cost) per item, so I know the real impact of doing work myself.

**US-122: DIY Materials Deductibility**
As a renovating owner, I want my DIY materials receipts tracked separately with a note that they're tax-deductible if paid via bonifico, so I don't miss that deduction.

### Export

**US-130: Commercialista Export**
As a renovating owner, I want to export a complete, organized package (invoices, payment records, deduction schedule, ENEA status, DIY materials) for my Italian accountant at tax time, so I don't show up with a shoebox of receipts.

**US-131: 10-Year Deduction Schedule**
As a renovating owner, I want to see my deduction schedule over 10 years (annual installment amounts per bonus type) so I can plan my Italian tax liability.

### Farmstead Operations

**US-140: Livestock Ongoing Cost Modeling**
As a buyer configuring a farmstead, I want to see the annual ongoing costs for each animal type (chickens €510–870/yr, goats €1,130–1,970/yr) alongside the setup costs, so I understand the total commitment, not just the initial investment.

**US-141: Farmstead DIY Time Estimate**
As a buyer planning DIY livestock care, I want to see the estimated daily time commitment (~30 min for chickens, ~45 min for goats) so I can assess whether the lifestyle is realistic for me.

**US-142: Livestock Value Offset**
As a buyer, I want to see the value offset from livestock production (eggs ~€1,260/yr, goat milk/cheese) against the cost of keeping them, so I understand the net cost and the Airbnb guest experience value.

**US-143: Pizza Oven Operating Costs**
As a buyer, I want to see ongoing pizza oven costs (wood €300–500/yr, maintenance, ingredients) in the operating budget, so the financial model reflects reality, not just the build cost.

**US-144: Courtyard Maintenance Costs**
As a buyer, I want ongoing courtyard costs (plants, lighting, furniture care, wine for tastings) in the operating budget, so the wine courtyard vision is costed realistically.

### Guest Separation

**US-150: Guest Separation Assessment**
As a buyer, I want the AI to evaluate whether the property layout supports independent guest entrances, separate outdoor areas, and visual/acoustic privacy from the owner residence, so I know before purchasing whether the Airbnb plan is physically feasible.

**US-151: Separation Cost Impact**
As a buyer, I want to see the additional renovation cost of creating proper guest separation (entrances, sound insulation, privacy landscaping, parking — typically €9–18K) broken out as a line item, so I budget for it explicitly.

**US-152: Separation Warning**
As a buyer, I want a clear warning if the building layout cannot support independent guest entrances without major structural work, flagged during AI analysis and reflected in the scoring matrix, so I don't discover this after purchasing.

### House Rules

**US-160: No-Smoking Policy Template**
As a property owner, I want the no-smoking policy automatically templated into every Airbnb listing and guest communication in multiple languages, so the rule is clear before booking and consistently enforced.

**US-161: House Rules Configuration**
As a property owner, I want to configure house rules (quiet hours, check-in times, pet policy, max occupancy) that are templated into listing descriptions and booking confirmations, so guest expectations are set upfront.

---

## 7. MVP Scope (Phase 1) — Updated

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Project + search criteria | Must | Foundation |
| Property input (guided upload) | Must | Data quality |
| AI analysis (Claude) | Must | Core value prop |
| Regulatory risk assessment | Must | Per Constitution N3 |
| Multiple renovation scenarios | Must | Per Constitution N7 |
| Financial model + DIY toggle | Must | Investment decision |
| Income projection (corrected timeline) | Must | Per Constitution N1 |
| Cedolare Secca + residency toggles | Must | Tax accuracy |
| Scoring matrix | Must | Comparison tool |
| Pipeline board | Must | Project tracking |
| Map integration (Mapbox) | Must | Location context |
| **Invoice capture + OCR** | **Must** | **Per Constitution P13, N9** |
| **Tax bonus categorization** | **Must** | **€34K–€48K at stake** |
| **Bonifico parlante generator** | **Must** | **Payment method is #1 failure point** |
| **Budget vs actual tracking** | **Must** | **Core renovation management** |
| **DIY savings tracker** | **Must** | **Validates the DIY toggle promise** |
| **ENEA deadline tracking** | **Must** | **Ecobonus loss prevention** |
| **Commercialista export** | **Must** | **Tax filing readiness** |
| **Farmstead ongoing costs in financial model** | **Must** | **Livestock, oven, courtyard = €3–6K/yr operating costs** |
| **Guest separation assessment** | **Must** | **Per Constitution N10 — flags infeasible layouts** |
| **No-smoking policy templates** | **Must** | **Per Constitution N11 — auto-included in listings** |
| i18n (English + Italian) | Must | Primary user base |

**Phase 2:** Visual renderings (GPT Image 2), layout conflict warnings, ARV estimator, energy assessment module, income sensitivity sliders, house rules configuration.

**Phase 3:** Currency conversion tracking, smart property operations, project sharing, contractor management, AirDNA integration.

---

## 8. Integrations

| Integration | Purpose | Priority |
|-------------|---------|----------|
| Mapbox GL JS | Interactive maps | MVP |
| Claude API | Analysis, estimates, comparisons | MVP |
| OCR (Tesseract or Claude Vision) | Invoice data extraction | MVP |
| Supabase Storage | Photos, invoices, documents, renderings | MVP |
| OpenAI GPT Image 2 | Visual renderings | Phase 2 |
| Wise API | Currency conversion tracking | Phase 3 |
| AirDNA API | Airbnb comparable data | Phase 3 |
| ENEA portal | Energy filing integration | Phase 3 |

---

## 9. Open Questions (Resolved)

| # | Resolution |
|---|------------|
| 1 | Manual upload only for MVP. Guided 9-step wizard. |
| 2 | OpenAI GPT Image 2 via API (Phase 2). |
| 3 | Pricing parked — separate spec. |
| 4 | English + Italian from day one. |
| 5 | Desktop primary, responsive. |
| 6 | No offline. |
| 7 | Mapbox GL JS. |
| 8 | 18-24 month renovation gap. Income starts Y2 partial / Y3 full. |
| 9 | Cedolare Secca toggle included. |
| 10 | Remote buyer is primary user. Currency tracking, site visits, remote management. |
| 11 | Cost tracking is MVP, not Phase 2. Worth €34K–€48K in protected deductions. |
| 12 | Livestock ongoing costs (€3–6K/yr) are in the financial model operating costs, not just setup. Strong DIY component (~1.5–2 hrs/day). |
| 13 | Guest apartments must be physically separated — independent entrances, separate terraces, no owner-guest sightlines, sound insulation. AI flags infeasible layouts during analysis. |
| 14 | Strict no-smoking everywhere on property. Positioned as "smoke-free farmstead" feature, not just a restriction. Templated into all listings and guest communications. |

---

## 10. Amendment Log

| Version | Date | Change | Rationale |
|---------|------|--------|-----------|
| 1.2.1 | 2026-05-15 | Implemented scoring matrix (11 criteria, AI-generated, configurable weights). ScoringPanel on Overview page. Compare page with multi-property matrix. | Build priority #11 |
| 1.2.2 | 2026-05-15 | Implemented renovation scenarios (Basic + Lifestyle via Claude API, per-call generation, 8192 max_tokens). ScenariosPanel with expandable phases and line item tables. | Build priority #9 |
| 1.2.3 | 2026-05-15 | Implemented financial model CostsPanel — now defaults to Operating P&L per N12. Five income lines (accommodation, wine, cooking, farm, olive oil). Farmstead ongoing costs (€3-6K/yr) toggleable. Sustainability headline. Investment break-even as collapsed secondary toggle. | Build priority #10, Constitution N12 |
| 1.2.4 | 2026-05-15 | Implemented Mapbox GL JS property map on project page. Pipeline-stage-colored markers, popups, auto-fit bounds. Graceful fallback for missing token or coordinates. | Build priority #12 |
| 1.2.5 | 2026-05-15 | Implemented invoice capture with tax compliance (N9). InvoicePanel with form, IVA rates, tax bonus selector, payment method validation, bonifico parlante auto-generation. Tax deduction tracker with progress bars per bonus type. Invoice page at /costs/invoice. | Build priority #13 |
| 1.2.6 | 2026-05-15 | Implemented Budget vs Actual panel. Compares scenario line items against actual invoices by phase. Variance tracking, DIY material savings, contingency headroom, unmatched invoice detection. | Build priority #14 |
| 1.2.7 | 2026-05-15 | Implemented Commercialista Export. CSV download with Italian headers (BOM for Excel). Bonus summary table, deductible invoice list, ENEA status warning, print support. | Build priority #15 |
| 1.2.8 | 2026-05-15 | Implemented Funding Sources panel with CRUD. USD→EUR conversion, status workflow (planned→in_progress→complete→received), progress bar against total investment. | Build priority #16 |
| 1.2.9 | 2026-05-15 | Implemented Operational Checklists — 33 Italy-specific items across 5 phases (pre-purchase through ongoing operations). Bilingual titles, regulatory flags, deadlines, priority levels. localStorage persistence. Auto-highlights current phase from pipeline stage. New Checklist tab on all property pages. | Build priority #17 |
| 1.2.10 | 2026-05-15 | Added Checklist tab to property navigation (all 7 pages updated). Renderings placeholder page (Phase 2) already in place. | Tab navigation consistency |
| 1.2.11 | 2026-05-15 | Implemented Phase 2: GPT Image visual rendering engine. OpenAI image generation API integration (`gpt-image-1`, 1536x1024, high quality). Region-aware prompt builder (10 Italian regions mapped to architectural styles). 7 rendering types (exterior front/rear, courtyard, interior living/kitchen/airbnb, aerial). Supabase Storage upload for generated images. RenderingsPanel with scenario filtering, lightbox, delete confirmation. N6 enforced: renderings require a renovation scenario. | Constitution P2 (vision leads), N6 (no rendering without renovation plan) |
| 1.2.12 | 2026-05-15 | Integrated multi-agent estimation engine (GitHub issue #2). Claude + GPT-4o + Gemini run in parallel, Zod-validated outputs, consensus synthesis with per-line-item confidence levels. Property mapper (DB row → PropertyInput). API route at `/api/ai/estimate-renovation`. DB migration 017 adds `divergence_report`, `confidence_score`, `agent_usage` columns to `renovation_scenarios`. "Multi-Agent Estimate" button on ScenariosPanel. DivergenceReport component with confidence breakdown, agent comparison bars, flagged item cards. Constitution N2 (contingency), N4 (regulated work), N8 (confidence labels), N10 (guest separation) enforced by engine. | GitHub issue #2, Constitution N2/N4/N8/N10 |
| 1.2.13 | 2026-05-15 | **N6 rendering rewrite**: switched from `images.generate()` (text-to-image) to `images.edit()` (inpainting). Original uploaded photo is now the canvas — camera angle, building footprint, and surroundings stay the same. Prompt builder rewritten to describe CHANGES (roof/walls/windows/grounds), not a new building. Source photo required for all renderings. New `BeforeAfterSlider.tsx` component with draggable comparison slider (CSS clip-path, mouse+touch). RenderingsPanel rewritten with source photo picker, before/after display. New `getPhotos` server action. Updated CLAUDE.md (v1.3 manifest), constitution copied to `docs/constitution.md`, requirements copied to `docs/requirements.md`. | Revised Constitution N6 — renderings must use inpainting, not generation |
| 1.2.14 | 2026-05-15 | **Estimate version history**: renovation scenarios now versioned (v1, v2, …). Old estimates are deactivated (`is_active = false`), never deleted. `getScenarios()` filters by `is_active = true`. `getScenarioHistory()` returns all versions for comparison. Migration 018 adds `version INTEGER` and `is_active BOOLEAN` columns. Both `/api/ai/estimate-renovation` and `/api/ai/scenarios` routes use deactivate-then-insert pattern. | Data preservation — estimates are refinements, not replacements |
| 1.2.15 | 2026-05-15 | **Agent alignment proof**: `buildAllItemComparisons()` exposes per-line-item agent estimates (Claude/GPT-4o/Gemini) for ALL items, not just flagged divergences. DivergenceReport rewritten with "Show all N items" / "Show flagged only" toggle. High-confidence items show green agreement bars. Items grouped by confidence level. | Proving agent consensus — "aligned" claims need visible evidence |
| 1.2.16 | 2026-05-15 | **Cost engine line item catalog**: `config/cost-line-items.ts` with 129 items across 17 categories. Each item has `unitCost`, `unitType` (€/m², €/unit, €/lin.m, forfait, etc.), `diyLaborPercent`, `taxBonus`, `toggleable` flag, `toggleGroup`/`radioGroup` for mutually exclusive options, `isOngoing` for operating cost flow. 5 regional multipliers (Tuscany Chianti 1.25 → Marche 0.88). Formula: `quantity × unitCost × regionalMultiplier × (1 - diyLaborDiscount)`. Lookup helpers for category, toggle group, radio group, regulated items, DIY-eligible items. | CLAUDE.md "Cost Engine — Line Item Structure" spec |
| 1.2.17 | 2026-05-15 | **Three-axis cost configurator** at `/property/[id]/scenarios/[sid]`. Three independent axes: (1) Scope toggles — what optional items are included (ScopeTogglePanel with group toggles and radio buttons), (2) DIY profile — project-level personal skills (DIYProfilePanel with per-item labor % and savings, regulated items locked per N4), (3) Phasing — Year 1/2/3 timing (PhaseTimeline with drag-to-reassign, summary bar). ScenarioCostConfigurator orchestrates all three with cost summary header showing contractor/DIY savings/effective/contingency/grand total. | Constitution N4, N2 (contingency), P9 (DIY changes math, not constraints) |
| 1.2.18 | 2026-05-15 | **Configurator DB persistence**: Migration 019 adds `scope_toggles JSONB` and `phase_assignments JSONB` to `renovation_scenarios`, creates `diy_profiles` table (project-level, per user). Server actions: `updateScopeToggles()`, `updatePhaseAssignments()`, `getDIYProfile()`, `updateDIYProfile()`. Configurator auto-saves with 800ms debounce, "Saving…" indicator. DIY profile loaded from DB on page load. | Persistence — configurator state survives page refresh |
| 1.2.19 | 2026-05-15 | **48-month project timeline**: `ProjectTimeline.tsx` Gantt chart with 13 renovation phases across 48 months. Phase bars colored by category (structural/systems/finishes/exterior/lifestyle). Year 1-2 contractor-managed from US, Year 3-4 owner DIY on-site. Cash flow tracking: monthly phase spend + carrying costs + living costs vs funding inflows (salary savings €8K/mo Y1-2, wife's income €5,833/mo Y3-4). Decision gates at month 24 (Move to Italy) and month 42 (Airbnb go-live). Cumulative spend and cash remaining charts. Liquidity warnings when cash goes negative. Hover tooltip with per-month breakdown. Phase dependency enforcement. Integrated as fourth tab ("Timeline") in ScenarioCostConfigurator. | CLAUDE.md "Project Timeline & Phase Sequencing" spec |
| 1.2.20 | 2026-05-15 | **Phasing/Timeline unification**: PhaseYear extended from 3 to 4 years. Unified color scheme: Y1=amber (Core Renovation), Y2=blue (Systems & Completion), Y3=emerald (Move & Finishes), Y4=stone (Lifestyle & Deferred). Both PhaseTimeline and ProjectTimeline share the same `YEAR_COLORS`/`YEAR_LABELS`/`YEAR_SUBTITLES` constants. PhaseTimeline now includes Annual Cash Flow table showing renovation spend + carrying costs (€1,250/mo) + living costs (€2,500/mo after move) vs funding inflows per year, with net cash needed. ProjectTimeline Gantt bars colored by year instead of category. Annual summary cards added above Gantt chart. Default phase assignments split: Y3=transition/hospitality, Y4=livestock/vehicles/greenhouse/security. Cumulative spend chart bars colored by year. | User request: "same timeframe, same colors, understand how much cash we need in each year" |
| 1.2.21 | 2026-05-15 | **Purchase price in Year 1 cash flow**: Property's `listed_price` threaded through page → configurator → PhaseTimeline (annual cash table "Purchase" row in Y1) and ProjectTimeline (Gantt "Purchase & Permits" phase now carries actual cost). | Year 1 cash flow must include acquisition cost |
| 1.2.22 | 2026-05-15 | **Household Profile**: Migration 020 creates `household_profiles` table (one per user, user_id UNIQUE). Fields: `partner_income` (€70K default), `partner_income_location` (us/italy), `impatriat_eligible`, `starting_cash` (€600K), `monthly_savings_rate` (€8K/mo), `us_phase_months` (24), `diy_phase_months` (24), `move_date`, `annual_living_costs` (€30K/yr), `adults` (2). RLS on user_id. Server actions: `getHouseholdProfile()` (returns defaults if no row), `updateHouseholdProfile()` (upsert). Permission actions `household:read` and `household:update` added to all tiers. Settings page at `/settings` with HouseholdProfileForm (auto-save, 800ms debounce, financial summary). | CLAUDE.md "Household Profile & Project Comparison" |
| 1.2.23 | 2026-05-15 | **Household profile wired into financial model**: `buildInflowsFromProfile()` and `buildGatesFromProfile()` replace hardcoded DEFAULT_INFLOWS/DEFAULT_GATES in timeline calculator. `computeMonthlySnapshots()` uses `moveMonth` from `TimelineConfig` instead of hardcoded month 24. PhaseTimeline and ProjectTimeline accept `householdProfile` prop — all hardcoded values (€600K starting cash, €8K/mo savings, €70K partner income, €2,500/mo living costs, month 24 move) now derived from household profile. Scenario detail page loads household profile in parallel with project/DIY data. | Remove duplicate inputs — household values flow from one source |
| 1.2.24 | 2026-05-15 | **Project Comparison page**: `/compare-projects` with side-by-side dashboard. Server action `getProjectComparisonData()` fetches project → first property → best scenario (lifestyle preferred). Client component `ProjectComparison.tsx` computes metrics: total investment (purchase + renovation + contingency), renovation duration, ongoing work hours, annual property income (€45K for hosting scenarios, €0 for private), operating costs, net from property, household total (property + partner income), cash remaining after project, privacy level, exit/resale value. Recalculates when project selection changes. Five qualitative comparison cards: Privacy, Daily routine, Social life, Purpose after renovation, Risk if partner stops working. NavBar updated with "Compare" link. | CLAUDE.md "Life Scenario Comparison" |

| 1.2.25 | 2026-05-15 | **Project types**: Migration 021 adds `project_type TEXT NOT NULL DEFAULT 'farmstead_hosting'` to projects table with CHECK constraint. Two types: `private_homestead` (no guests, no income) and `farmstead_hosting` (Airbnb/agriturismo, full scope). Type chosen at project creation via radio selector in NewProjectForm. Cascades through: scoring (8 vs 11 criteria, redistributed weights), AI prompts (analysis, scenarios, score — project type context injected), cost engine (guest_separation category + airbnb items filtered for homestead), timeline (no Airbnb go-live gate, no guest-separation/airbnb-fitout phases), financial model (no income for homestead), search criteria (agriturismo checkbox hidden), project comparison (uses project_type instead of scenario type). Type exported from `@/types/project` as canonical source. | User requirement: "every property is evaluated for Airbnb hosting — this must change" |
| 1.2.26 | 2026-05-15 | **Location & Life Intelligence**: Migration 022 adds `location_intelligence JSONB` to properties table. New property tab "Location & Life" with four sections: (1) Regulatory feasibility checklist — Claude AI-researched per commune, green/yellow/red per question, project-type-aware (10 questions hosting, 7 homestead), with verification source hints; (2) Distance cards — 7 POI categories (supermarket, bakery, pharmacy, hospital, vet, train station, airport) via Mapbox Geocoding + Directions APIs with drive times and color coding; (3) Community profile — AI-assessed expat presence, demographics, language, events, outdoor activities, cycling, internet connectivity, overall vibe; (4) Accessibility map — Mapbox GL JS with property marker, POI markers with popups, 3 isochrone rings (10/20/30 min) via Mapbox Isochrone v1 API. API route `POST /api/ai/location-intelligence` (300s timeout). Tab added to all property pages. | User requirement: "Build a new property tab Location & Life" |

---

*End of Requirements v1.2*

*This document, combined with the Constitution v1.1 and CLAUDE.md, defines the complete product specification for Progetto Casa Colonica.*
