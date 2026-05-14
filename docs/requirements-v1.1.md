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
 └── Projects
      ├── SearchCriteria
      ├── ScoringWeights
      ├── Properties
      │    ├── ListingData
      │    ├── AIAnalysis
      │    ├── RegulatoryAssessment
      │    ├── EnergyAssessment
      │    ├── LayoutAssessment
      │    ├── ScoringResult
      │    ├── RenovationScenarios (basic/lifestyle/high-end/custom)
      │    │    ├── Phases → LineItems (DIY toggle per item)
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
      ├── ComparisonMatrix
      └── Contacts
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

*End of Requirements v1.1*

*This document, combined with the Constitution v1.1 and CLAUDE.md, defines the complete product specification for Progetto Casa Colonica.*
