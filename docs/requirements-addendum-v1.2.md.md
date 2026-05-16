# Claude Code — Initialization Prompt

## How to start

### 1. Create the repo and add the foundation files

```bash
mkdir progetto-casa-colonica
cd progetto-casa-colonica
git init
```

Copy these files into the repo:
- `CLAUDE.md` → repo root (rename CLAUDE-final.md to CLAUDE.md)
- `docs/constitution-v1.1.md`
- `docs/requirements-v1.2.md`

### 2. Open Claude Code

```bash
claude
```

### 3. Paste this prompt

---

```
I'm starting a new project: Progetto Casa Colonica — a SaaS platform for Italian farmhouse acquisition and renovation feasibility analysis.

Read the CLAUDE.md first. It contains:
- The full project architecture and build priority
- Aditus (@revolutionizing-development/aditus) integration patterns for IAM
- 11 non-negotiable rules from the Constitution
- Domain rules for pipeline stages, financial modeling, tax compliance, and scoring

Then read docs/requirements-v1.2.md for the complete feature spec and data model.

Start with Build Priority items 1-4:
1. Initialize the Next.js 14+ project with App Router, TypeScript, Tailwind
2. Set up the database schema (Supabase migrations) with RLS policies for all tables
3. Integrate Aditus — install the package, create lib/auth.ts, lib/stores.ts, config/permissions.ts
4. Set up i18n with next-intl (English + Italian, [locale] routing)

Create the full project skeleton with all directories from the CLAUDE.md structure, but only implement steps 1-4 in this session. Use .env.example for all environment variables.

Do NOT implement auth from scratch — Aditus handles it. Do NOT skip RLS policies. Do NOT use CSS modules — Tailwind only.

IMPORTANT: When you implement any feature, update docs/requirements-v1.2.md in the same session to reflect what was actually built. The requirements doc is a living document — it describes what the app does today, not what was planned. Add a change note to the amendment log at the bottom.
```

---

### 4. Subsequent sessions

After the foundation is set, continue with:

```
Continue from where we left off. Read CLAUDE.md for context.
Next priorities from the build list: items 5-7.
5. Project CRUD with search criteria
6. Property input — the guided 9-step upload wizard
7. Claude analysis integration — analyze-property prompt, parser, and regulatory assessment

Follow the patterns established in session 1 for auth (Aditus checkAccess), data access (Supabase with RLS), and routing ([locale] prefix).
```

Then for financial modeling:

```
Continue. Build priority items 9-10:
9. Renovation scenarios — generate Basic + Lifestyle for each property
10. Financial model — the full model builder including:
    - 3-level DIY toggle (global/phase/item, with locked regulated items)
    - Farmstead ongoing costs (chickens, goats, pizza oven, courtyard)
    - 5-line income projection (accommodation, wine, cooking, farm, olive oil)
    - Corrected timeline: Y0-Y1 zero income, Y2 partial, Y3 ramp-up, Y4 stable
    - Monthly cash flow resolution (not annual)
    - Confidence tracking (Estimated → Quoted → Confirmed → Actual)
    - Cedolare Secca toggle + Bonus Ristrutturazione cap tracking

Per Constitution N1: no income before renovation completes.
Per Constitution N2: mandatory 15-25% contingency.
Per Constitution N4: electrical, structural, gas, seismic locked to contractor.
```

Then for cost tracking:

```
Continue. Build priority items 13-15:
13. Invoice capture with OCR (photo → extract vendor, Partita IVA, amount, IVA rate)
14. Tax bonus auto-categorization (Ristrutturazione/Ecobonus/Sismabonus/Mobili)
15. Bonifico parlante generator — exact text string for bank transfer
16. Budget vs actual dashboard
17. DIY savings tracker (confirmed savings = contractor estimate minus actual materials)
18. ENEA deadline tracking (90 days after energy work completion)
19. Commercialista export (PDF + CSV bundle)

Per Constitution N9: every invoice checked for deductibility before recording.
Per Constitution P13: documentation is money — up to €48K in deductions at stake.
```

---

## Notes

- Each session should read CLAUDE.md first — it's the single source of truth
- Reference the constitution for any ambiguous decisions
- The requirements doc has the full data model (Supabase schema) and all user stories
- When in doubt about a feature's behavior, the constitution's principles win
- Aditus is the only authorization path — never write inline permission checks
