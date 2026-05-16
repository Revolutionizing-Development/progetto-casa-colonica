import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/app/actions/projects';
import { getProperties, type PropertyRow } from '@/app/actions/properties';
import EditProjectForm from '@/components/project/EditProjectForm';
import PropertyMap from '@/components/map/PropertyMap';

interface Props {
  params: { locale: string; id: string };
}

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

export default async function ProjectPage({ params: { locale, id } }: Props) {
  const [project, properties] = await Promise.all([
    getProject(id),
    getProperties(id),
  ]);

  if (!project) notFound();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500 flex items-center gap-1.5">
        <Link href={`/${locale}/dashboard`} className="hover:text-stone-900 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">{project.name}</span>
      </nav>

      {/* Project header + inline edit */}
      <EditProjectForm project={project} locale={locale} />

      {/* Project type badge */}
      <div className="flex items-center gap-2 -mt-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          project.project_type === 'private_homestead'
            ? 'bg-stone-100 text-stone-700'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {project.project_type === 'private_homestead' ? 'Private Homestead' : 'Farmstead + Hosting'}
        </span>
      </div>

      {/* Quick nav */}
      <div className="flex gap-3 border-t border-stone-100 pt-6 flex-wrap">
        <Link
          href={`/${locale}/project/${id}/criteria`}
          className="px-4 py-2 rounded-md border border-stone-200 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Search Criteria &amp; Scoring Weights
        </Link>
        <Link
          href={`/${locale}/project/${id}/compare`}
          className="px-4 py-2 rounded-md border border-stone-200 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Compare Properties
        </Link>
      </div>

      {/* Map */}
      <PropertyMap properties={properties} locale={locale} />

      {/* Properties */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            Properties
            {properties.length > 0 && (
              <span className="ml-2 text-sm font-normal text-stone-400">
                ({properties.length})
              </span>
            )}
          </h2>
          <Link
            href={`/${locale}/project/${id}/property/new`}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            + Add Property
          </Link>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 p-10 text-center">
            <p className="text-stone-400 text-sm mb-4">
              No properties added yet. Add your first farmhouse listing to begin analysis.
            </p>
            <Link
              href={`/${locale}/project/${id}/property/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Add your first property →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 overflow-hidden">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PropertyCard({
  property,
  locale,
}: {
  property: PropertyRow;
  locale: string;
}) {
  const featureBadges = [
    property.has_olive_grove && '🫒',
    property.has_vineyard && '🍇',
    property.has_outbuildings && '🏚',
    property.has_pool && '🏊',
    property.has_pizza_oven && '🍕',
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/${locale}/property/${property.id}`}
      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-stone-900 group-hover:text-amber-700 transition-colors">
            {property.name}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              STAGE_COLORS[property.pipeline_stage] ?? 'bg-stone-100 text-stone-600'
            }`}
          >
            {STAGE_LABELS[property.pipeline_stage] ?? property.pipeline_stage}
          </span>
          {featureBadges.length > 0 && (
            <span className="text-sm" aria-label="Features">
              {featureBadges.join('')}
            </span>
          )}
        </div>
        <p className="text-sm text-stone-400 mt-0.5">
          {[property.commune, property.region].filter(Boolean).join(', ') || 'Location not set'}
          {property.sqm_house > 0 && ` · ${property.sqm_house} m²`}
          {property.num_bedrooms != null && ` · ${property.num_bedrooms}bd`}
        </p>
      </div>

      <div className="text-right shrink-0">
        <div className="text-base font-bold text-stone-900">
          {property.listed_price > 0
            ? `€${property.listed_price.toLocaleString()}`
            : '—'}
        </div>
        <div className="text-xs text-stone-400">listed</div>
      </div>
    </Link>
  );
}
