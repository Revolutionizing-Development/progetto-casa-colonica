import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProperty } from '@/app/actions/properties';
import { getProject } from '@/app/actions/projects';
import { getScenarios } from '@/app/actions/scenarios';
import { getRenderings } from '@/app/actions/renderings';
import { getPhotos } from '@/app/actions/photos';
import RenderingsPanel from '@/components/property/RenderingsPanel';

interface Props {
  params: { locale: string; id: string };
}

const tabs = (locale: string, id: string) => [
  { label: 'Overview', href: `/${locale}/property/${id}` },
  { label: 'Scenarios', href: `/${locale}/property/${id}/scenarios` },
  { label: 'Costs', href: `/${locale}/property/${id}/costs` },
  { label: 'Renderings', href: `/${locale}/property/${id}/renderings`, active: true },
  { label: 'Checklist', href: `/${locale}/property/${id}/checklist` },
  { label: 'Location & Life', href: `/${locale}/property/${id}/location` },
  { label: 'Pipeline', href: `/${locale}/property/${id}/pipeline` },
];

export default async function RenderingsPage({ params: { locale, id } }: Props) {
  const property = await getProperty(id);
  if (!property) notFound();

  const [project, scenarios, renderings, photos] = await Promise.all([
    getProject(property.project_id),
    getScenarios(id),
    getRenderings(id),
    getPhotos(id),
  ]);

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
        <Link
          href={`/${locale}/property/${id}`}
          className="hover:text-stone-900 transition-colors"
        >
          {property.name}
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">Renderings</span>
      </nav>

      <h1 className="text-2xl font-bold text-stone-900 mb-6">{property.name}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 mb-8 overflow-x-auto">
        {tabs(locale, id).map((tab) => (
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

      <RenderingsPanel
        propertyId={id}
        scenarios={scenarios}
        initialRenderings={renderings}
        photos={photos}
      />
    </main>
  );
}
