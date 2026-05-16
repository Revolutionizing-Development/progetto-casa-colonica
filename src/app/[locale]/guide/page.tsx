import Link from 'next/link';

interface Props {
  params: { locale: string };
}

export default function SearchGuidePage({ params: { locale } }: Props) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500 flex items-center gap-1.5 mb-6">
        <Link href={`/${locale}/dashboard`} className="hover:text-stone-900 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">Property Search Guide</span>
      </nav>

      <h1 className="text-2xl font-bold text-stone-900 mb-2">
        Finding Your Italian Farmhouse
      </h1>
      <p className="text-stone-500 text-sm mb-10 max-w-xl leading-relaxed">
        A practical guide to searching for rural Italian properties that match your project.
        Learn what to look for, what to avoid, and how to use the platform&apos;s tools
        to make faster, better decisions.
      </p>

      {/* Section 1: Where to Search */}
      <GuideSection number={1} title="Where to Search" id="where">
        <p>
          Italian property listings are spread across several platforms. Each has different
          strengths. Start with all of them — the overlap is smaller than you&apos;d expect.
        </p>

        <SourceCard
          name="Immobiliare.it"
          url="https://www.immobiliare.it"
          notes="Largest Italian portal. Best filters for rural properties. Use &quot;rustico&quot; or &quot;casale&quot; as property type. Supports English interface."
          strength="Most listings, best filters"
        />
        <SourceCard
          name="Idealista.it"
          url="https://www.idealista.it"
          notes="Second largest. Sometimes has listings not on Immobiliare. Good map-based search. Use &quot;Case rurali&quot; or &quot;Rustici&quot; category."
          strength="Map search, price history"
        />
        <SourceCard
          name="Casa.it"
          url="https://www.casa.it"
          notes="Smaller selection but occasionally has exclusive listings from smaller agencies."
          strength="Agency exclusives"
        />
        <SourceCard
          name="Gate-Away.com"
          url="https://www.gate-away.com"
          notes="Specifically targets foreign buyers. English-language. Pre-filtered for rural/renovation properties. Higher price premium."
          strength="English-first, curated for foreigners"
        />
        <SourceCard
          name="Local agents (Geometra / Agenzia)"
          notes="Many of the best properties never make it online. Once you&apos;ve narrowed your target region, contact local agents directly. Ask for &quot;rustici da ristrutturare&quot; (farmhouses to renovate)."
          strength="Off-market properties"
        />

        <Tip>
          Set up saved searches with email alerts on Immobiliare and Idealista.
          Good properties in popular regions (Toscana, Umbria, Marche) sell within 2-4 weeks.
        </Tip>
      </GuideSection>

      {/* Section 2: Search Terms */}
      <GuideSection number={2} title="Key Italian Search Terms" id="terms">
        <p>
          Italian listings use specific vocabulary. Knowing these terms lets you filter
          more effectively and read descriptions before translation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <TermCard term="Casale" meaning="Farmhouse — the classic stone country house" />
          <TermCard term="Rustico" meaning="Rural/rustic building — often needs renovation" />
          <TermCard term="Podere" meaning="Farm estate — house + agricultural land" />
          <TermCard term="Colonica" meaning="Tenant farmhouse — typical Tuscan/Umbrian style" />
          <TermCard term="Rudere" meaning="Ruin — walls standing, no roof. Cheapest, hardest." />
          <TermCard term="Da ristrutturare" meaning="To renovate — expect significant work" />
          <TermCard term="Ristrutturato" meaning="Already renovated — higher price, less work" />
          <TermCard term="Abitabile" meaning="Habitable — livable condition, may still need updating" />
          <TermCard term="Terreno" meaning="Land (agricultural)" />
          <TermCard term="Annesso" meaning="Outbuilding / annex — potential guest unit" />
          <TermCard term="Uliveto" meaning="Olive grove" />
          <TermCard term="Vigneto" meaning="Vineyard" />
          <TermCard term="Classe energetica G" meaning="Worst energy class — no insulation, full upgrade needed" />
          <TermCard term="Vincolo paesaggistico" meaning="Landscape protection — limits exterior changes" />
        </div>
      </GuideSection>

      {/* Section 3: What Makes a Good Candidate */}
      <GuideSection number={3} title="What Makes a Good Candidate" id="good-candidate">
        <p>
          Not every cheap farmhouse is a good investment. Here&apos;s what to prioritize
          when scanning listings:
        </p>

        <ChecklistGroup title="Must-haves" items={[
          'Road access — confirm the property is reachable by car year-round (look for "strada comunale" or "strada provinciale")',
          'Water supply — municipal water (acquedotto) is ideal. Well-only properties need testing and backup plans.',
          'Electrical connection — most farmhouses have it, but check. Off-grid ruins cost €15,000-25,000 to connect.',
          'Structural walls intact — stone walls standing = viable. Missing walls or collapsed sections = much higher cost.',
          'Roof present — even a damaged roof is better than no roof. A missing roof means the structure has been exposed to weather damage.',
        ]} variant="green" />

        <ChecklistGroup title="Strong positives" items={[
          'Multiple buildings / annessi — separate structures make guest separation much easier (critical for hosting projects)',
          'South-facing aspect — better light, solar potential, views',
          '1-5 ha of land — enough for agriturismo classification, olive grove, garden',
          'Within 15 min of a town — guests need restaurants, shops, pharmacy',
          'Existing olive grove — income potential, landscape charm, agriturismo credential',
          'Energy class listed (even G) — means the property has a valid APE certificate',
        ]} variant="amber" />

        <ChecklistGroup title="Red flags in listings" items={[
          '"Accesso pedonale" or "no vehicle access" — no road access means massive infrastructure cost',
          '"Progetto approvato" (approved project) priced into the listing — you pay for someone else\'s architect fees',
          'No photos of the interior — usually means the inside is in worse shape than described',
          'Price per m² far below regional average — investigate why. Structural issues, legal problems, or inaccessible location',
          '"Condonato" or "condono" — previous building violation that was amnestied. Check the documentation carefully.',
          'Multiple owners listed — inheritance properties with many heirs can take months/years to untangle',
          '"Terreno agricolo" without a building — just agricultural land, no existing structure to renovate',
        ]} variant="red" />
      </GuideSection>

      {/* Section 4: Price Benchmarks */}
      <GuideSection number={4} title="Price Benchmarks by Region" id="prices">
        <p>
          Prices vary dramatically by region. These are approximate ranges for farmhouses
          needing renovation (2024-2025 market):
        </p>

        <div className="mt-4 space-y-2">
          <PriceRow region="Toscana (Chianti, Val d'Orcia)" range="€300K–800K+" notes="Most expensive. Tourist premium. Beautiful but competitive." />
          <PriceRow region="Umbria" range="€150K–400K" notes="Best value near Toscana. Less touristic, still accessible." />
          <PriceRow region="Marche" range="€80K–250K" notes="Excellent value. Adriatic coast nearby. Seismic zone 2." />
          <PriceRow region="Abruzzo" range="€50K–180K" notes="Cheapest. Mountains, national parks. Seismic zone 1. More remote." />
          <PriceRow region="Puglia" range="€120K–350K" notes="Trulli and masserie. Growing tourist market. Hot summers." />
          <PriceRow region="Lazio (non-Rome)" range="€100K–300K" notes="Good value outside Rome. Lake Bolsena, Tuscia area." />
          <PriceRow region="Piemonte" range="€100K–300K" notes="Wine country. Cooler climate. Less British/American buyer competition." />
          <PriceRow region="Sicilia" range="€40K–200K" notes="Lowest prices. €1 house programs exist but come with obligations." />
        </div>

        <Tip>
          The listed price is the starting point, not the final price. In Italy,
          negotiation of 10-20% is normal, especially for properties listed more than 6 months.
          Check the listing date — properties sitting longer than 12 months signal motivated sellers.
        </Tip>
      </GuideSection>

      {/* Section 5: The QuickScan Workflow */}
      <GuideSection number={5} title="Using QuickScan to Filter Fast" id="quickscan">
        <p>
          The full AI analysis takes 60-120 seconds and uses significant API resources.
          For efficient property screening, use the two-step workflow:
        </p>

        <div className="mt-4 space-y-4">
          <WorkflowStep
            step={1}
            title="Add the property"
            description="Enter basic data from the listing into the property wizard. You don't need every field — name, location, price, house size, land size, and energy class are enough."
            time="2 min"
          />
          <WorkflowStep
            step={2}
            title="Run QuickScan"
            description="Click QuickScan on the property overview. In ~10 seconds, you get a pass/maybe/fail verdict with key observations. Uses a lightweight AI model at ~10x lower cost."
            time="10 sec"
          />
          <WorkflowStep
            step={3}
            title="Decide: skip or investigate"
            description="If QuickScan says 'fail' — skip the property and move on. If 'pass' or 'maybe' — proceed to the full analysis."
            time="instant"
          />
          <WorkflowStep
            step={4}
            title="Full AI Analysis (if warranted)"
            description="Run the comprehensive structural + regulatory analysis. This generates the condition score, 10-category regulatory risk matrix, agriturismo eligibility, and key risks/opportunities."
            time="60-120 sec"
          />
          <WorkflowStep
            step={5}
            title="Score and compare"
            description="After full analysis, run the scoring engine to get a weighted 0-100 score. Compare across properties using the project comparison view."
            time="15 sec"
          />
        </div>

        <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
          <p className="text-sm font-semibold text-stone-800 mb-2">Cost comparison</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-stone-500">QuickScan (Haiku)</p>
              <p className="font-bold text-stone-900">~$0.01-0.02</p>
              <p className="text-xs text-stone-400">~10 seconds</p>
            </div>
            <div>
              <p className="text-stone-500">Full Analysis (Sonnet)</p>
              <p className="font-bold text-stone-900">~$0.10-0.20</p>
              <p className="text-xs text-stone-400">60-120 seconds</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3">
            Scanning 20 properties with QuickScan first saves ~$2 compared to running full analysis on all of them.
            More importantly, it saves 30+ minutes of waiting time.
          </p>
        </div>
      </GuideSection>

      {/* Section 6: Reading Between the Lines */}
      <GuideSection number={6} title="Reading Between the Lines" id="reading">
        <p>
          Italian real estate listings follow cultural conventions different from
          US/UK markets. Here&apos;s how to decode common patterns:
        </p>

        <div className="mt-4 space-y-3">
          <DecodingCard
            listing="&quot;Posizione panoramica&quot; (panoramic position)"
            reality="Usually means it's on a hill with views — good. But check road access. Panoramic often means remote."
          />
          <DecodingCard
            listing="&quot;Da personalizzare&quot; (to personalize)"
            reality="Needs total renovation. This is agent-speak for 'it's a shell.'"
          />
          <DecodingCard
            listing="&quot;Trattativa riservata&quot; (private negotiation)"
            reality="Price not listed. Usually means it's expensive and flexible. Can also mean complex ownership."
          />
          <DecodingCard
            listing="&quot;Libero subito&quot; (available immediately)"
            reality="Good sign — means no tenants, no complex inheritance, ready to transact."
          />
          <DecodingCard
            listing="&quot;Ideale per B&B&quot; (ideal for B&B)"
            reality="Agent suggesting potential use. Verify this with the actual zoning — not all rural zones allow hospitality."
          />
          <DecodingCard
            listing="Energy class not listed"
            reality="Assume Class G (worst). If it were better, the agent would advertise it."
          />
          <DecodingCard
            listing="Photos only show the exterior"
            reality="Interior is in poor condition. If the kitchen were renovated, you'd see photos of it."
          />
        </div>
      </GuideSection>

      {/* Section 7: The Evaluation Pipeline */}
      <GuideSection number={7} title="From Listing to Decision" id="pipeline">
        <p>
          Here&apos;s the complete workflow this platform supports, from first seeing a listing
          to making a decision:
        </p>

        <div className="mt-4">
          <PipelineStep
            stage="Scouted"
            description="Property added from a listing. Basic data entered."
            action="Run QuickScan for fast triage."
          />
          <PipelineStep
            stage="Analyzing"
            description="Full AI analysis running. Structural assessment + regulatory risk matrix generated."
            action="Review analysis, run scoring."
          />
          <PipelineStep
            stage="Shortlisted"
            description="Property passed analysis. Compare with other shortlisted properties."
            action="Generate renovation scenarios, run cost estimation."
          />
          <PipelineStep
            stage="Site Visit"
            description="Schedule and prepare for an in-person visit."
            action="Print checklist, review location intelligence."
          />
          <PipelineStep
            stage="Negotiating"
            description="Making an offer. Cost models inform max bid."
            action="Generate renderings, finalize financial model."
            isLast
          />
        </div>
      </GuideSection>

      {/* Footer CTA */}
      <div className="mt-12 mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <h2 className="text-lg font-bold text-stone-900 mb-2">Ready to start searching?</h2>
        <p className="text-sm text-stone-600 mb-4">
          Create a project, add properties from listings, and let the AI help you find the right one.
        </p>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function GuideSection({
  number,
  title,
  id,
  children,
}: {
  number: number;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
          {number}
        </span>
        <h2 className="text-lg font-bold text-stone-900">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-stone-700 leading-relaxed pl-9">
        {children}
      </div>
    </section>
  );
}

function SourceCard({
  name,
  url,
  notes,
  strength,
}: {
  name: string;
  url?: string;
  notes: string;
  strength: string;
}) {
  return (
    <div className="p-4 bg-white border border-stone-200 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-stone-900">
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-700">
              {name} ↗
            </a>
          ) : (
            name
          )}
        </h3>
        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
          {strength}
        </span>
      </div>
      <p className="text-sm text-stone-600">{notes}</p>
    </div>
  );
}

function TermCard({ term, meaning }: { term: string; meaning: string }) {
  return (
    <div className="p-3 bg-white border border-stone-200 rounded-lg">
      <dt className="font-semibold text-stone-900 text-sm">{term}</dt>
      <dd className="text-xs text-stone-600 mt-0.5">{meaning}</dd>
    </div>
  );
}

function ChecklistGroup({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: 'green' | 'amber' | 'red';
}) {
  const colors = {
    green: { bg: 'bg-green-50', border: 'border-green-200', dot: 'text-green-500', title: 'text-green-800' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'text-amber-500', title: 'text-amber-800' },
    red: { bg: 'bg-red-50', border: 'border-red-200', dot: 'text-red-500', title: 'text-red-800' },
  };
  const c = colors[variant];

  return (
    <div className={`mt-4 p-4 ${c.bg} border ${c.border} rounded-lg`}>
      <p className={`text-sm font-semibold ${c.title} mb-2`}>{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
            <span className={`${c.dot} shrink-0 mt-0.5`}>
              {variant === 'red' ? '✗' : '✓'}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriceRow({
  region,
  range,
  notes,
}: {
  region: string;
  range: string;
  notes: string;
}) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-sm font-medium text-stone-900 w-48 shrink-0">{region}</span>
      <span className="text-sm font-bold text-stone-800 w-28 shrink-0">{range}</span>
      <span className="text-xs text-stone-500">{notes}</span>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
      <span className="text-amber-600 shrink-0 mt-0.5 text-sm">💡</span>
      <p className="text-sm text-amber-800">{children}</p>
    </div>
  );
}

function WorkflowStep({
  step,
  title,
  description,
  time,
}: {
  step: number;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <span className="w-8 h-8 rounded-full bg-stone-800 text-white text-sm font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <div className="w-px h-full bg-stone-200 mt-1" />
      </div>
      <div className="pb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-stone-900">{title}</h3>
          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{time}</span>
        </div>
        <p className="text-sm text-stone-600 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function DecodingCard({ listing, reality }: { listing: string; reality: string }) {
  return (
    <div className="p-3 bg-white border border-stone-200 rounded-lg">
      <p className="text-sm font-medium text-stone-900" dangerouslySetInnerHTML={{ __html: listing }} />
      <p className="text-sm text-stone-600 mt-1">{reality}</p>
    </div>
  );
}

function PipelineStep({
  stage,
  description,
  action,
  isLast,
}: {
  stage: string;
  description: string;
  action: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 mt-1" />
        {!isLast && <div className="w-px flex-1 bg-stone-200 mt-1 min-h-[2rem]" />}
      </div>
      <div className={isLast ? '' : 'pb-4'}>
        <h3 className="font-semibold text-stone-900 text-sm">{stage}</h3>
        <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        <p className="text-xs text-amber-700 mt-1">→ {action}</p>
      </div>
    </div>
  );
}
