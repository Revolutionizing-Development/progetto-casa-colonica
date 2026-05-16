# Progetto Casa Colonica — Constitution v1.1

## PROGETTO CASA COLONICA

**Constitution**

The foundational principles governing the Rural Italian Property Feasibility Platform.

Applies to: All features, modules, and AI integrations within the application.

Stack: Next.js · Clerk · Supabase · Aditus (`@revolutionizing-development/aditus`) · Claude API · OpenAI GPT Image 2

Version 1.1 · May 2026

*Companion to: Requirements v1.1 · CLAUDE.md*

---

## Preamble

This Constitution defines the non-negotiable principles that govern every product decision in Progetto Casa Colonica. It is not a technical specification (that's the Requirements document). It is not a how-to guide (that's the CLAUDE.md). It is the set of beliefs and constraints that anchor every feature, UX, and AI decision.

These principles emerged from months of real property analysis — comparing ruins vs fixer-uppers, modeling renovation costs with DIY toggles, projecting Airbnb income with seasonal occupancy curves, evaluating regulatory risk across Italian communes, planning farmstead layouts with goats, chickens, pizza ovens, and wine courtyards, and discovering that €34,000–€48,000 in Italian tax deductions can be lost through a single improperly documented invoice. The insights are hard-won; this Constitution preserves them.

*If a proposed feature, shortcut, or design decision conflicts with a principle in this document, the principle wins. Change the proposal, not the Constitution.*

---

## Scope

This Constitution applies to all features, AI prompts, financial models, and user-facing interfaces within Progetto Casa Colonica. It does NOT cover authentication, authorization, metering, or audit logging — those are governed by the IAM Component Constitution v1.0 and implemented via @platform-kit/iam.

---

## The Principles

**Principle 1: Feasibility, Not Fantasy**

This is not a real estate listing app. It is not a property search engine. It is a feasibility analyzer that answers one question: "Can this specific rural Italian property become the life/business compound I want — without blowing the budget, violating regulations, ruining the guest experience, or destroying the investment case?" Every feature serves this question. If a feature doesn't help answer it, it doesn't ship.

**Principle 2: The Vision Leads, The Numbers Follow**

The first thing a buyer sees is the dream — an AI-rendered image of what the property could become. The second thing they see is the location on a real map. The third thing they see is whether the numbers make the dream possible. This order is deliberate. People buy farmhouses with their hearts, then justify with their heads. The app respects this psychology while ensuring the justification is rigorous.

**Principle 3: Honest Numbers Over Optimistic Numbers**

Every financial model must show the full picture, including the painful parts. The 18-24 month renovation gap with zero income. The carrying costs while managing from the US. The cumulative cash flow valley that bottoms before income begins. The regulatory risks that could kill a project. No model assumes best-case occupancy, no estimate hides the contingency, no projection starts income before renovation completes. Buyers trust this app because it tells the truth.

**Principle 4: Every Number Starts As An Estimate And Earns Its Confidence**

Data has a lifecycle: Estimated → Quoted → Confirmed → Actual. The app tracks which numbers are AI guesses and which are backed by contractor invoices. A financial model that is 12% confirmed data is treated differently than one at 85% confirmed. This confidence tracking is not optional decoration — it is the mechanism that turns a planning tool into a project management tool as the buyer progresses from scouting to renovation.

**Principle 5: One Property, Many Visions**

The same farmhouse can be a €200K basic renovation (livable, minimal Airbnb) or a €600K lifestyle project (wine courtyard, pizza oven, solar field, premium hospitality). The app must let users model multiple renovation scenarios for the same property and compare their financial outcomes side by side. A property that fails as a high-end project may succeed as a basic renovation. The buyer needs to see both before deciding.

**Principle 6: The Land Is Part Of The Building**

Italian farmhouse buying is not just about the building. The olive grove, the flat arable land, the slope, the views, the access road — these determine what's possible as much as the roof condition. Can you put goats here? Is there room for a solar field without cutting olive trees? Will the courtyard get evening sun? The app treats land characteristics as first-class data, not an afterthought.

**Principle 7: Regulations Before Renderings**

A beautiful rendering of a property you can't legally use as an Airbnb is a cruel fantasy. Before the app generates visions of wine courtyards and guest apartments, it should flag regulatory risks: Is short-term rental allowed in this commune? Can you legally keep animals here? Are there landscape protection constraints on solar panels? Does the property sit in a seismic zone that affects renovation scope? Regulatory risk scores feed directly into the decision scorecard.

**Principle 8: The Farmstead Is A System, Not A List**

Goats near guest terraces create smell conflicts. Solar panels in the sightline of the courtyard ruin the aesthetics. A chicken coop downwind from the pizza oven is a health risk. Guest apartments that share a hallway with the owner's bedroom destroy privacy for everyone. The app must understand spatial relationships between farmstead elements, not just list them. When a user toggles "add goats," the system should evaluate where they can physically go without conflicting with the guest experience, the courtyard, or the solar field. Guest separation — independent entrances, separate terraces, no sightlines between owner and guest zones — is a layout requirement that the AI evaluates during property analysis, not an afterthought during renovation.

**Principle 9: DIY Changes The Math, Not The Constraints**

The DIY toggle reduces costs by removing labor, but it cannot remove regulatory requirements. Electrical certification, structural engineering, gas connections, and seismic compliance require licensed Italian professionals regardless of the buyer's skills. The app locks these items and explains why. DIY also changes the timeline — the app should model the time cost, not just the money saved.

**Principle 10: The App Evolves With The Buyer**

A scouted property has AI estimates. A shortlisted property has some contractor quotes. An acquired property has real invoices. A property under renovation has actual spend vs budget. The app is useful at every stage, but it becomes more accurate as real data replaces estimates. This evolution is not just data storage — the UI visually communicates how much of the financial model is based on reality vs projection.

**Principle 11: Italy-Specific, Not Generic**

This app is built for Italian farmhouses, not generic global real estate. It knows about IMU and TARI. It knows about Cedolare Secca vs progressive tax. It knows about geometras, compromessos, and rogitos. It knows that Energy Class G means zero insulation. It knows that central Italy is seismic zone 2. It knows the difference between agriturismo and locazione turistica. Generic real estate tools fail because they don't speak the language of Italian rural property. This one does.

**Principle 12: Remote Buyers Are The Primary User**

Most users will be buying from abroad — the US, UK, Northern Europe, Australia. They're managing renovation from 5,000 miles away. They're converting currencies. They're flying over for site visits. The app must serve this reality: trip planning, contractor communication logging, progress photo management, currency conversion tracking, and time zone-aware notifications. The app doesn't assume the buyer is in Italy.

**Principle 13: Documentation Is Money**

In Italy, the difference between a properly documented renovation and a poorly documented one is tens of thousands of euros in lost tax deductions. The Bonus Ristrutturazione alone offers up to €48,000 in deductions on a primary residence — but only if every invoice has the correct Partita IVA, every payment goes through a bonifico parlante with the exact legal reference text, and ENEA deadlines for energy work are met. A single improperly documented payment means that expense is permanently non-deductible. The app treats invoice capture, payment method verification, tax bonus categorization, and deadline tracking as core functionality — not bookkeeping. Every invoice that passes through the system is a potential €136/year in tax savings for the next decade. The cost tracking module is not a Phase 2 nice-to-have; it is one of the most valuable features in the entire product.

**Principle 14: Operating Sustainability Over Investment Return**

Buyers don't ask "when do I recoup my €560K?" They ask "can I afford to live there?" The financial model defaults to the annual operating P&L: income vs running costs = net operating income. The purchase and renovation are an asset acquisition — the buyer owns a €700K+ property they also live in. The operating model tells them whether that life is sustainable. The sustainability indicator ("Self-sustaining from Year 3, +€2,250–3,650/month") is the single most important number in the financial model. Investment break-even (18 years from rental alone, 8 years with appreciation) is available as a secondary toggle for investors, but it is never the default view.

**Principle 15: Requirements Are Living Code**

The requirements document (`docs/requirements-v1.2.md`) is part of the codebase, not a separate artifact that goes stale. When Claude Code implements a feature, adds a table, changes a type, or modifies a flow, it updates the requirements document in the same session. When a feature is descoped, deferred, or redesigned during implementation, the requirements reflect the actual state — not the planned state. The requirements document is the source of truth for "what does this app do today," not "what did we hope it would do when we started." Version bumps and change notes in the amendment log are mandatory for any material change.

---

## Non-Negotiables

| # | Non-Negotiable | Why It's Absolute |
|---|---|---|
| N1 | No income projections before renovation is complete. | Showing Airbnb income in Year 1 of a 24-month renovation is a lie that builds false confidence. |
| N2 | No renovation estimate without contingency. | Italian farmhouse renovations overrun. 15-25% contingency is mandatory in every scenario. |
| N3 | No regulatory risk hidden behind positive scores. | A property with a red regulatory flag cannot receive a "Strong Candidate" recommendation regardless of other scores. |
| N4 | No DIY toggle on regulated work. | Electrical, structural, gas, and seismic work requires licensed Italian professionals. The app cannot suggest otherwise. |
| N5 | No financial model without carrying costs. | IMU, insurance, and utilities during renovation are real costs. Omitting them inflates ROI. |
| N6 | Renderings use image editing, not image generation. | AI renderings use the original uploaded photo as the canvas via `images.edit()` (inpainting), NEVER `images.generate()` (text-to-image). The rendering preserves the exact camera angle, building footprint, surrounding landscape, and context from the original photo. Only renovation elements are modified — roof, walls, windows, grounds. The result is displayed in a before/after slider at the same angle. A rendering that changes the building's shape, angle, materials beyond the renovation scope, or surroundings is a failed rendering and must be regenerated. No rendering without both a source photo AND a renovation plan. |
| N7 | No single-scenario analysis. | Every property must support at least Basic and Lifestyle renovation scenarios. Users need comparison to decide. |
| N8 | All AI estimates are labeled as estimates. | No AI-generated number is presented as fact. Confidence level is always visible. |
| N9 | No expense recorded without tax eligibility check. | Every invoice entering the system is checked for deductibility: valid Partita IVA, correct payment method (bonifico parlante), applicable bonus category. Non-qualifying payments are flagged immediately — not discovered at tax time. A cash payment to a contractor is money the user can never recover through deductions; the app must warn them before the payment is made, not after. |
| N10 | Guest apartments are physically separated from the owner residence. | Guests must have independent entrances, separate outdoor seating, no sightlines to owner spaces, sound insulation, and separate parking. If a building layout cannot support independent guest entrances, the AI flags this during analysis — before the buyer falls in love with the property. Shared spaces (courtyard, pizza oven) are accessed on a scheduled basis, never through the owner's private areas. |
| N11 | No smoking anywhere on the property. | This is a strict, non-negotiable house rule applied across all Airbnb listings — inside, outside, terraces, courtyards, gardens, parking. No exceptions, no designated smoking areas. The app templates this into every listing, every booking confirmation, and every guest communication. "Smoke-free farmstead" is positioned as a feature for families and wellness travelers, not just a restriction. |
| N12 | Financial model defaults to operating P&L, not investment break-even. | The default view shows annual income vs annual operating costs = net operating income. This answers "can I afford this life?" — the question that keeps buyers up at night. Investment break-even (18 years from rental, 8 with appreciation) is available as a secondary toggle but never the default. The sustainability indicator ("Self-sustaining from Year 3") and monthly net cash flow (+€2,250–3,650/mo) are the headline numbers. |
| N13 | Requirements document updated in the same session as feature implementation. | Per P15: `docs/requirements-v1.2.md` is part of the codebase, not a separate artifact. When Claude Code implements a feature, it updates the requirements doc to match actual behavior. When a feature is descoped, the doc reflects reality. The requirements describe what the app does today — never what it was supposed to do. |

---

## Product Positioning

**This app is NOT:**
- A real estate listing aggregator (we don't search listings)
- A property search engine (users bring their own listings)
- A generic renovation calculator (we're Italy-specific)
- A property management platform (we stop at renovation completion)
- An accounting tool (we prepare data for the commercialista, we don't replace them)

**This app IS:**
- A rural Italian property feasibility analyzer
- An investment decision tool for foreign buyers
- A renovation scope and budget planner with AI analysis
- A visual rendering engine that shows the outcome before commitment
- A living financial model that evolves from fantasy to reality
- A tax-aware cost tracking system that protects tens of thousands in deductions
- A remote renovation management companion for buyers managing from abroad

**The question it answers:**
"Can this specific rural Italian property become the life/business compound I want — without blowing the budget, violating regulations, ruining the guest experience, or destroying the investment case?"

**The value it protects:**
Up to €48,000 in Italian renovation tax deductions through proper documentation, payment method verification, and deadline tracking — enough to pay for years of subscription from a single renovation project.

---

## IAM Integration — Aditus

This application uses `@revolutionizing-development/aditus` as its identity, authorization, and metering layer. Per the IAM Constitution v1.0:

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

**The boundary:** Aditus receives a verified `uid` and a `UserStore`. It never touches tokens, login UI, or the database directly. Everything else is the app's job.

This app NEVER implements its own auth, authorization, or metering logic.

---

## Governance

**Ownership:** The founder owns this Constitution. No principle can be added, removed, or modified without the founder's explicit approval.

**Amendment process:** Same as the IAM Constitution — written proposal, impact assessment, founder approval, version bump.

**Review cadence:** Reviewed when a new feature area is proposed, when user feedback reveals a principle gap, when the Italian regulatory or tax landscape changes, or when a non-negotiable is violated.

---

## Appendix A: Amendment Log

| Version | Date | Change | Rationale |
|---------|------|--------|-----------|
| 1.0 | May 2026 | Initial constitution adopted. | Codifies lessons from Italian property analysis. Incorporates Claude, ChatGPT, and Gemini evaluations. |
| 1.1 | May 2026 | Added P13 (Documentation Is Money), P14 (Operating Sustainability), P15 (Living Documentation), N9 (tax eligibility check), N10 (guest separation), N11 (no-smoking), N12 (operating P&L default), N13 (requirements maintenance). Updated P8 to include guest separation. Updated product positioning. | Tax deductions worth €34K–€48K require precise documentation. Guest separation is physical design requirement. No-smoking is strict property-wide policy. Financial model defaults to operating P&L ("can I afford this life?") not investment break-even. Requirements document maintained as living code by Claude Code. |

*End of Constitution*
