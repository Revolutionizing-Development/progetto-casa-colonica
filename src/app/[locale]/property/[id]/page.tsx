import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProperty } from '@/app/actions/properties';
import { getProject } from '@/app/actions/projects';
import { getAIAnalysis, getRegulatoryAssessment } from '@/app/actions/ai';
import { getScoring } from '@/app/actions/scoring';
import AIAnalysisPanel from '@/components/property/AIAnalysisPanel';
import ScoringPanel from '@/components/property/ScoringPanel';

interface Props {
  params: { locale: string; id: string };
}

const STAGE_LABELS: Record<string, string> = {
  scouted: 'Scouted',
  analyzing: 'Analyzing',
  shortlisted: 'Shortlisted',
  site_visit: 'Site Visit',
  negotiating: 'Negotiating',
  under_contract: 'Under Contract',
  closing: 'Closing',
  acquired: 'Acquired',
  renovating: 'Renovating',
  complete: 'Complete',
};

const STAGE_COLORS: Record<string, string> = {
  scouted: 'bg-stone-100 text-stone-600',
  analyzing: 'bg-blue-50 text-blue-700',
  shortlisted: 'bg-amber-50 text-amber-700',
  site_visit: 'bg-orange-50 text-orange-700',
  negotiating: 'bg-purple-50 text-purple-700',
  under_contract: 'bg-indigo-50 text-indigo-700',
  closing: 'bg-pink-50 text-pink-700',
  acquired: 'bg-green-50 text-green-700',
  renovating: 'bg-teal-50 text-teal-700',
  complete: 'bg-emerald-50 text-emerald-700',
};

function formatPrice(n: number): string {
  return `€${n.toLocaleString('en-US')}`;
}

function formatHa(sqm: number): string {
  const ha = sqm / 10000;
  return ha < 1 ? `${sqm.toLocaleString()} m²` : `${ha.toFixed(2)} ha`;
}

export default async function PropertyPage({ params: { locale, id } }: Props) {
  const [property, existingAnalysis, existingRegulatory] = await Promise.all([
    getProperty(id),
    getAIAnalysis(id),
    getRegulatoryAssessment(id),
  ]);

  if (!property) notFound();

  const [project, existingScoring] = await Promise.all([
    getProject(property.project_id),
    getScoring(id, property.project_id),
  ]);

  const featureTags = [
    property.has_olive_grove &&
      `🫒 Olive grove${property.olive_tree_count ? ` (${property.olive_tree_count} trees)` : ''}`,
    property.has_vineyard && '🍇 Vineyard',
    property.has_outbuildings &&
      `🏚 Outbuildings${property.outbuilding_sqm ? ` (${property.outbuilding_sqm} m²)` : ''}`,
    property.has_pool && '🏊 Pool',
    property.has_pizza_oven && '🍕 Pizza oven',
  ].filter(Boolean) as string[];

  const tabs = [
    { label: 'Overview', href: `/${locale}/property/${id}`, active: true },
    { label: 'Scenarios', href: `/${locale}/property/${id}/scenarios` },
    { label: 'Costs', href: `/${locale}/property/${id}/costs` },
    { label: 'Renderings', href: `/${locale}/property/${id}/renderings` },
    { label: 'Checklist', href: `/${locale}/property/${id}/checklist` },
    { label: 'Location & Life', href: `/${locale}/property/${id}/location` },
    { label: 'Pipeline', href: `/${locale}/property/${id}/pipeline` },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500 flex items-center gap-1.5 mb-6">
        <Link href={`/${locale}/dashboard`} className="hover:text-stone-900 transition-colors">
          Projects
        </Link>
        <span>/</span>
        {project && (
          <>
            <Link
              href={`/${locale}/project/${property.project_id}`}
              className="hover:text-stone-900 transition-colors"
            >
              {project.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-stone-900 font-medium">{property.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-stone-900">{property.name}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                STAGE_COLORS[property.pipeline_stage] ?? 'bg-stone-100 text-stone-600'
              }`}
            >
              {STAGE_LABELS[property.pipeline_stage] ?? property.pipeline_stage}
            </span>
            {existingRegulatory?.overall_risk === 'red' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                🔴 Red Flag
              </span>
            )}
          </div>
          {(property.commune || property.region) && (
            <p className="text-stone-500 text-sm mt-1">
              {[property.commune, property.province, property.region]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab.active
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Listed Price" value={formatPrice(property.listed_price)} />
        <MetricCard label="House" value={`${property.sqm_house} m²`} />
        <MetricCard label="Land" value={formatHa(property.sqm_land)} />
        <MetricCard
          label="Bedrooms / Baths"
          value={
            property.num_bedrooms != null
              ? `${property.num_bedrooms}bd / ${property.num_bathrooms ?? '?'}ba`
              : '—'
          }
        />
      </div>

      {/* Features */}
      {featureTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {featureTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full text-sm text-stone-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">Building</h2>
          <dl className="space-y-2">
            {property.year_built && (
              <DetailRow label="Year built" value={String(property.year_built)} />
            )}
            {property.energy_class && (
              <DetailRow
                label="Energy class"
                value={`Class ${property.energy_class}${
                  property.energy_class === 'G' ? ' — no insulation' : ''
                }`}
              />
            )}
            {property.listing_source && (
              <DetailRow label="Source" value={property.listing_source} />
            )}
            {property.listing_url && (
              <DetailRow
                label="Listing"
                value={
                  <a
                    href={property.listing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline"
                  >
                    View original listing ↗
                  </a>
                }
              />
            )}
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">Land</h2>
          <dl className="space-y-2">
            <DetailRow label="Total land" value={formatHa(property.sqm_land)} />
            {property.land_ha >= 1 && (
              <DetailRow
                label="Prelazione agraria"
                value="Applies — neighboring farmers have right of first refusal"
              />
            )}
          </dl>
        </section>
      </div>

      {/* Listing description */}
      {property.listing_description && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Listing Description
          </h2>
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 text-sm text-stone-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {property.listing_description}
          </div>
        </section>
      )}

      {/* Notes */}
      {property.notes && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Your Notes
          </h2>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
            {property.notes}
          </div>
        </section>
      )}

      {/* AI Analysis Panel — client component */}
      <AIAnalysisPanel
        propertyId={id}
        initialAnalysis={existingAnalysis}
        initialRegulatory={existingRegulatory}
      />

      <div className="border-t border-stone-100 pt-8 mt-8">
        <ScoringPanel propertyId={id} initialScoring={existingScoring} />
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-white border border-stone-200 rounded-xl">
      <dt className="text-xs text-stone-400 mb-1">{label}</dt>
      <dd className="text-lg font-bold text-stone-900 leading-tight">{value}</dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-stone-100 last:border-0">
      <dt className="text-sm text-stone-500 shrink-0">{label}</dt>
      <dd className="text-sm text-stone-800 text-right">{value}</dd>
    </div>
  );
}
