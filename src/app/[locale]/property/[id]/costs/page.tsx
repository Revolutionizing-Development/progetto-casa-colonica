import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProperty } from '@/app/actions/properties';
import { getProject } from '@/app/actions/projects';
import { getScenarios } from '@/app/actions/scenarios';
import { getInvoices, getTaxTracker } from '@/app/actions/invoices';
import { getFundingSources } from '@/app/actions/funding';
import CostsPanel from '@/components/property/CostsPanel';
import BudgetActualPanel from '@/components/costs/BudgetActualPanel';
import FundingPanel from '@/components/financial/FundingPanel';
import CommercialistaExport from '@/components/costs/CommercialistaExport';

interface Props {
  params: { locale: string; id: string };
}

const tabs = (locale: string, id: string) => [
  { label: 'Overview', href: `/${locale}/property/${id}` },
  { label: 'Scenarios', href: `/${locale}/property/${id}/scenarios` },
  { label: 'Costs', href: `/${locale}/property/${id}/costs`, active: true },
  { label: 'Renderings', href: `/${locale}/property/${id}/renderings` },
  { label: 'Checklist', href: `/${locale}/property/${id}/checklist` },
  { label: 'Location & Life', href: `/${locale}/property/${id}/location` },
  { label: 'Pipeline', href: `/${locale}/property/${id}/pipeline` },
];

export default async function CostsPage({ params: { locale, id } }: Props) {
  const [property, scenarios, invoices, tracker, fundingSources] = await Promise.all([
    getProperty(id),
    getScenarios(id),
    getInvoices(id),
    getTaxTracker(id),
    getFundingSources(id),
  ]);

  if (!property) notFound();

  const project = await getProject(property.project_id);
  const propertyAddress = [property.commune, property.region].filter(Boolean).join(', ');

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
        <span className="text-stone-900 font-medium">Costs</span>
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

      <div className="space-y-12">
        <CostsPanel property={property} scenarios={scenarios} />

        {/* Budget vs Actual */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Budget vs Actual</h2>
          <BudgetActualPanel
            scenarios={scenarios}
            invoices={invoices}
            selectedScenarioId={scenarios[0]?.id}
          />
        </div>

        {/* Funding Sources */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Funding Sources</h2>
          <FundingPanel
            propertyId={id}
            initialSources={fundingSources}
            totalInvestment={
              scenarios[0]
                ? property.listed_price + Math.round((scenarios[0].renovation_total_min + scenarios[0].renovation_total_max) / 2)
                : undefined
            }
          />
        </div>

        {/* Commercialista Export */}
        <div className="print:break-before-page">
          <CommercialistaExport
            propertyName={property.name}
            propertyAddress={propertyAddress}
            invoices={invoices}
            tracker={tracker}
          />
        </div>
      </div>
    </main>
  );
}
