import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProperty } from '@/app/actions/properties';
import type { PropertyRow } from '@/app/actions/properties';
import { getProject } from '@/app/actions/projects';
import { getScenarios, getDIYProfile } from '@/app/actions/scenarios';
import { getHouseholdProfile } from '@/app/actions/household';
import ScenarioCostConfigurator from '@/components/costs/ScenarioCostConfigurator';
import type { RenovationScenario } from '@/types/renovation';
import type { RegionalMultiplierKey } from '@/config/cost-line-items';

interface Props {
  params: { locale: string; id: string; sid: string };
}

const tabs = (locale: string, id: string) => [
  { label: 'Overview', href: `/${locale}/property/${id}` },
  { label: 'Scenarios', href: `/${locale}/property/${id}/scenarios`, active: true },
  { label: 'Costs', href: `/${locale}/property/${id}/costs` },
  { label: 'Renderings', href: `/${locale}/property/${id}/renderings` },
  { label: 'Checklist', href: `/${locale}/property/${id}/checklist` },
  { label: 'Pipeline', href: `/${locale}/property/${id}/pipeline` },
];

function detectRegion(property: PropertyRow): RegionalMultiplierKey {
  const region = (property.region ?? '').toLowerCase();
  if (region.includes('toscan') || region.includes('tuscan')) return 'tuscany_south';
  if (region.includes('umbri')) return 'umbria';
  if (region.includes('lazio')) return 'lazio_north';
  if (region.includes('march')) return 'marche';
  return 'umbria';
}

export default async function ScenarioDetailPage({ params: { locale, id, sid } }: Props) {
  const [property, scenarios] = await Promise.all([
    getProperty(id),
    getScenarios(id),
  ]);

  if (!property) notFound();

  const scenario = scenarios.find((s: RenovationScenario) => s.id === sid);
  if (!scenario) notFound();

  const [project, diyToggles, householdProfile] = await Promise.all([
    getProject(property.project_id),
    getDIYProfile(property.project_id),
    getHouseholdProfile(),
  ]);
  const region = detectRegion(property);

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
        <Link
          href={`/${locale}/property/${id}/scenarios`}
          className="hover:text-stone-900 transition-colors"
        >
          Scenarios
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">{scenario.name}</span>
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

      <ScenarioCostConfigurator
        propertyId={id}
        projectId={property.project_id}
        scenarioId={sid}
        scenarioType={scenario.type}
        scenarioName={scenario.name}
        purchasePrice={property.listed_price}
        householdProfile={householdProfile}
        initialRegion={region}
        initialScope={((scenario as unknown as Record<string, unknown>).scope_toggles as Record<string, boolean>) ?? {}}
        initialDiy={diyToggles}
        initialPhases={((scenario as unknown as Record<string, unknown>).phase_assignments as Record<string, 1 | 2 | 3>) ?? {}}
        initialQuantities={{}}
      />
    </main>
  );
}
