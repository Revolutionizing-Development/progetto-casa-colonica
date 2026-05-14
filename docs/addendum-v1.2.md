# Progetto Casa Colonica — Requirements Addendum v1.2

## Changes from v1.1 → v1.2

*This addendum captures additions identified from past project work (Progetto Casa Toscana financial workbook, Loire Valley assessment engine) and conversation history. These changes should be merged into the consolidated Requirements v1.2 and CLAUDE.md before build.*

---

## ADD-1: Experience-Based Income Model

The income projection currently models only Airbnb accommodation revenue. Past project work modeled five separate income streams. The financial model needs all five.

**Income lines (in the 5-year P&L):**

| Income Stream | Year 1 | Year 2 | Year 3 | Year 4 | Notes |
|--------------|--------|--------|--------|--------|-------|
| Airbnb accommodation (2 units) | €0 | €5-10K | €25-35K | €40-50K | Seasonal, ADR-based |
| Wine tastings | €0 | €0 | €5-10K | €10-18K | €45-65/person, 6-10 guests, 2-3×/wk Apr-Oct. User has WSET L2. |
| Cooking classes / pizza nights | €0 | €0 | €3-6K | €6-10K | €35-120/person, 4-6 guests. Uses pizza oven + kitchen. |
| Farm experiences (tours, egg collecting) | €0 | €0 | €1-3K | €2-5K | Low cost, high charm. Families love it. |
| Olive oil production | €0 | €0 | €800-1.5K | €1.5-2.5K | 40-60 trees, 100-200L/yr × €8-12/L. Gift + sell + cook. |

**Experience income is separate from accommodation** — different regulations (fewer requirements than accommodation), different seasonality (Apr-Oct only), different cost structure (ingredients, wine, your time), and stackable with accommodation. A guest staying in Apartment 1 can also book a wine tasting — they're two revenue events, not one.

**New user stories:**

- **US-170:** As a buyer, I want to model experience-based income (wine tastings, cooking classes, pizza nights, farm tours) as a separate line from accommodation, so I see the full revenue picture.
- **US-171:** As a buyer, I want to input my experience pricing (€/person, capacity, sessions/week, season length) and see projected annual income, so I can calibrate the experience business.
- **US-172:** As a buyer, I want to see the combined accommodation + experience income in the 5-year P&L, so I understand total revenue trajectory.

---

## ADD-2: Olive Oil & Land Production

Properties with olive groves or arable land have production potential that offsets costs and enhances the guest experience.

**Olive oil model:**
- Input: number of olive trees (from listing data or user count)
- Yield: 10-15 kg olives/tree → 1.5-2.5L oil/tree
- 50 trees = 75-125L oil/year
- Value: €8-12/L retail, €15-20/L for premium estate-bottled
- Uses: personal consumption, Airbnb welcome basket, direct sales, cooking class ingredient, gift to wine tasting guests
- Cost: grove maintenance €200-400/yr (pruning, harvesting — strong DIY), pressing at local frantoio €150-300/yr

**The app should:** detect olive groves from listing data or aerial photos, estimate tree count, project oil yield, and include it as an income/offset line in the financial model.

---

## ADD-3: Agriturismo vs Locazione Turistica Path

This is a critical regulatory and tax decision that should be evaluated per property.

**Agriturismo:**
- Requires agricultural activity on the land (olive grove, vegetable garden, livestock qualify)
- Favorable flat-rate tax regime (IVA at 50% deduction)
- Can host on-farm experiences (wine tastings, cooking classes, farm tours) without separate permits
- Must derive >50% of income from agricultural activity (or accommodation must be secondary to farming)
- Registration with regional Agriturismo authority
- Annual reporting requirements

**Locazione turistica:**
- Simpler setup — just register the rental activity
- Cedolare Secca applies (21%/26% flat tax)
- Cannot host chargeable on-farm experiences under this classification
- No agricultural activity required
- Lower regulatory burden but less income potential

**The regulatory module should:** evaluate which path suits each property based on land characteristics (olive grove? arable land? livestock potential?) and the user's intended income model (accommodation only vs accommodation + experiences). Recommend the better path and flag requirements for each.

**New user stories:**
- **US-175:** As a buyer, I want the app to evaluate whether Agriturismo or Locazione Turistica is the better classification for each property, based on land characteristics and my income model, so I choose the right regulatory path.

---

## ADD-4: Land Size Thresholds & Alerts

Italian law creates different obligations at different land sizes. The app should flag these.

| Threshold | Trigger | Implication |
|-----------|---------|-------------|
| >1 hectare | Fascicolo aziendale | Agricultural registration may be required |
| >1 hectare | Prelazione agraria | Neighboring farmers have right of first refusal on sale |
| >1 hectare | Maintenance obligation | Commune can fine for unmaintained land (fire risk) |
| >3 hectares | Tractor territory | Land maintenance requires equipment, not just hand tools |
| >5 hectares | IAP consideration | May trigger professional farmer classification |

**Wild boar fencing (Umbria/Tuscany specific):** €3,500 per hectare for proper boar-proof fencing. Boar will destroy vegetable gardens in one night and eat olive harvest off the ground. The farm features cost calculator should include boar fencing as a line item for properties in boar-affected zones.

**New user story:**
- **US-176:** As a buyer, I want the app to alert me when a property's land area crosses regulatory thresholds (1 ha, 3 ha, 5 ha) and explain the implications, so I understand the obligations before purchasing.

---

## ADD-5: Phased Outbuilding Conversion

Past project work showed that outbuildings can be converted in later years as separate income-generating phases. The renovation scenario should support this.

**Examples from our analysis:**
- Year 0-2: Main house + 2 Airbnb apartments (core renovation)
- Year 3: "Forno Suite" — convert annex near the pizza oven into a romantic 1-bed suite (€25-35K)
- Year 4: "Barn Loft" — convert fienile/barn into an open-plan loft with mezzanine (€30-40K)

**The app should:** let users add future conversion phases to existing scenarios with their own timelines. These phases appear in the 5-year P&L as future capex with corresponding future income from the new units. The income projection shows the step-up when each new unit comes online.

**New user story:**
- **US-177:** As a buyer, I want to add phased outbuilding conversions (Year 3 annex, Year 4 barn) to my renovation scenario with separate budgets and income projections, so I can plan the multi-year expansion of the property.

---

## ADD-6: Funding Sources Model

The financial model currently shows costs but not where the money comes from. Past project work built a funding model with adjustable parameters.

**Funding sources to track:**

| Source | Status Options | Notes |
|--------|---------------|-------|
| Property sale (US) — Property 1 | Listed / Under contract / Sold / Cash received | Track individual properties being liquidated |
| Property sale (US) — Property 2 | Same | |
| Investment liquidation | Planned / In progress / Complete | Stock portfolio, 401k, etc. |
| Salary savings (monthly rate × months) | Adjustable | Blue-cell pattern: user sets monthly savings rate, system calculates total by timeline |
| Existing cash | Available | Already in bank |
| Currency conversions | Per-tranche tracking | Date, USD amount, rate, EUR received |
| Mortgage (if applicable) | Applied / Approved / Disbursed | Terms, rate, monthly payment |

**The app should:** show total available funding alongside total project cost, with a gap/surplus indicator. As funding sources are confirmed (property sells, savings accumulate, conversions complete), the confidence level of the funding model improves.

**New user story:**
- **US-180:** As a buyer, I want to track my funding sources (US property sales, savings, investments, currency conversions) alongside project costs, so I can see whether I can afford this project and when the funding will be available.

---

## ADD-7: Monthly Cash Flow (Not Just Annual)

Renovation spend is lumpy — large contractor payments in specific months, not evenly distributed. The financial model needs monthly granularity.

**Monthly cash flow shows:**
- Month-by-month outflows (renovation phases, carrying costs, operating expenses)
- Month-by-month inflows (funding sources arriving, rental income starting)
- Cumulative position (the "valley" chart at monthly resolution)
- Alerts when cumulative position approaches zero (liquidity warning)

**New user story:**
- **US-181:** As a buyer, I want to see monthly cash flow projections (not just annual) showing when large payments are due and when income starts, so I can plan liquidity and avoid running out of money mid-renovation.

---

## ADD-8: Employment Income During Transition

Most buyers will maintain employment income during the first 2-3 years. The financial model should include this.

**Inputs:**
- Employment type: US remote / Italian corporate / Self-employed / Not working
- Monthly net income (after tax)
- Italian tax regime: standard / Impatriati (30% exemption on qualifying foreign income for up to 5 years)
- Duration: how long will employment continue alongside the property

**The P&L should show:** total household income = employment + property (accommodation + experiences + production). This gives a complete picture of sustainability during the transition years when the property isn't yet self-supporting.

**New user story:**
- **US-182:** As a buyer, I want to include my employment income in the financial model (with Italian tax regime toggle) so I can see total household sustainability during the renovation and ramp-up years.

---

## ADD-9: Zone Assessment Layer

From the Loire Valley engine: formalize the "golden corridor" concept as a reusable zone assessment.

**Zone classifications:**
- 🟢 **High opportunity** — strong tourism, good property supply, favorable regulations, growing Airbnb market, accessible
- 🟡 **Medium interest** — some factors positive, investigate further
- 🟠 **Evaluate carefully** — regulatory concerns, limited tourism, or price/value mismatch
- 🔴 **Avoid** — high regulations, low returns, no tourism base, hostile to foreign buyers

**Per zone, the app tracks:** average property prices, Airbnb ADR and occupancy, tourist flow, regulatory friendliness, accessibility (airports, train), community receptiveness to foreign buyers, landscape protection status.

**Mapbox integration:** zones are displayed as colored overlays on the map. Properties automatically inherit zone classification. Zone data feeds into the Location Quality criterion in the scoring matrix.

**New user story:**
- **US-185:** As a buyer, I want to see zone classifications (high/medium/caution/avoid) on the map so I can focus my search in the most promising areas.

---

## ADD-10: Go/No-Go Decision Gates

From the project playbook: pipeline stages should have built-in decision points, not just progress tracking.

**Gates at key pipeline stages:**

| Stage → Gate | Decision Question | Data Required |
|-------------|-------------------|---------------|
| Analyzing → Shortlist | "Does this property meet minimum criteria?" | AI analysis complete, regulatory risk assessed, at least one scenario modeled |
| Shortlisted → Site Visit | "Is it worth a €2,000 trip to see this?" | Scoring above threshold, no red regulatory flags, funding available |
| Site Visit → Negotiate | "After seeing it in person, do the numbers still work?" | Site visit photos uploaded, estimates adjusted, at least one contractor quote |
| Negotiate → Contract | "Is the agreed price within our model?" | Acquisition price confirmed, full financial model updated, funding sources confirmed |
| Contract → Close | "Are all legal and financial requirements met?" | Geometra report, notaio engaged, funding disbursed, insurance arranged |

**The app should:** display gate criteria at each pipeline transition and show which are met/unmet. Users can override gates but must acknowledge they're proceeding without full information.

**New user story:**
- **US-186:** As a buyer, I want decision gates at key pipeline stages that show me which criteria are met before I proceed, so I don't make emotional decisions without the right data.

---

## ADD-11: Operational Checklists

From the project playbook: the 12-section operational guide becomes in-app checklists.

**Checklist categories:**
1. Team building (geometra, notaio, commercialista, architect, contractor)
2. Pre-purchase due diligence (visura catastale, APE, building permits, debt check)
3. Purchase process (compromesso → rogito sequence)
4. Negotiation strategy (opening offer, counter, walk-away price)
5. Inspections (structural survey, roof, systems, septic, water)
6. Payment mechanics (bonifico for purchase, deposit handling)
7. Taxes (registration, IMU registration, TARI setup)
8. Utilities (electricity, gas, water, internet — transfer or new connection)
9. Residency (codice fiscale, AIRE registration, anagrafe, health coverage)
10. Property knowledge (neighbor introductions, seasonal patterns, local services)
11. Contractor selection (3 quotes rule, references, contract terms)
12. Remote management setup (key holder, emergency contacts, monitoring)

Each checklist item has: description, status (not started / in progress / complete), due date (relative to pipeline stage), linked documents, notes.

**New user story:**
- **US-187:** As a buyer, I want operational checklists for each phase of the acquisition process (team building, due diligence, purchase, residency) so nothing falls through the cracks.

---

## Summary of Changes v1.1 → v1.2

| Area | Change | Impact |
|------|--------|--------|
| Income model | 5 separate income streams (accommodation, wine, cooking, farm, olive oil) | Major — financial model restructure |
| Olive oil | Production model from grove data | New module |
| Agriturismo path | Regulatory module evaluates best classification | New assessment |
| Land thresholds | Alerts at 1ha/3ha/5ha + boar fencing | Enhancement to regulatory module |
| Outbuilding phases | Year 3-4 conversion as planned future phases | Enhancement to renovation scenarios |
| Funding sources | Track where money comes from, not just where it goes | New module |
| Monthly cash flow | Monthly resolution, not just annual | Enhancement to financial model |
| Employment income | Household income during transition years | Enhancement to financial model |
| Zone assessment | Formalized golden corridor as reusable zone classification | New map layer |
| Decision gates | Go/no-go criteria at pipeline transitions | Enhancement to pipeline |
| Operational checklists | 12-category guided checklist system | New module |
| New user stories | US-170 through US-187 | 14 new stories |

---

*End of Addendum v1.2*

*Merge into Requirements v1.2 and update CLAUDE.md before build.*
