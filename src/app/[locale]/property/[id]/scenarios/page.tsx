import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProperty } from '@/app/actions/properties';
import { getProject } from '@/app/actions/projects';
import { getAIAnalysis } from '@/app/actions/ai';
import { getScenarios } from '@/app/actions/scenarios';
import ScenariosPanel from '@/components/property/ScenariosPanel';

interface Props {
  params: { locale: string; id: string };
}

const tabs = (locale: string, id: string) => [
  { label: 'Overview', href: `/${locale}/property/${id}` },
  { label: 'Scenarios', href: `/${locale}/property/${id}/scenarios`, active: true },
  { label: 'Costs', href: `/${locale}/property/${id}/costs` },
  { label: 'Renderings', href: `/${locale}/property/${id}/renderings` },
  { label: 'Checklist', href: `/${locale}/property/${id}/checklist` },
  { label: 'Location & Life', href: `/${locale}/property/${id}/location` },
  { label: 'Pipeline', href: `/${locale}/property/${id}/pipeline` },
];

export default async function ScenariosPage({ params: { locale, id } }: Props) {
  const [property, analysis, scenarios] = await Promise.all([
    getProperty(id),
    getAIAnalysis(id),
    getScenarios(id),
  ]);

  if (!property) notFound();

  const project = await getProject(property.project_id);

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
        <span className="text-stone-900 font-medium">Scenarios</span>
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

      <ScenariosPanel
        propertyId={id}
        locale={locale}
        initialScenarios={scenarios}
        hasAnalysis={!!analysis}
      />
    </main>
  );
}
