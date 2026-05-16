import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/app/actions/projects';
import { getSearchCriteria } from '@/app/actions/search-criteria';
import { getScoringWeights } from '@/app/actions/scoring-weights';
import SearchCriteriaForm from '@/components/project/SearchCriteriaForm';
import ScoringWeightsForm from '@/components/project/ScoringWeightsForm';

interface Props {
  params: { locale: string; id: string };
}

export default async function CriteriaPage({ params: { locale, id } }: Props) {
  const [project, criteria, weights] = await Promise.all([
    getProject(id),
    getSearchCriteria(id),
    getScoringWeights(id),
  ]);

  if (!project) notFound();

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500 flex items-center gap-1.5">
        <Link href={`/${locale}/dashboard`} className="hover:text-stone-900 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <Link href={`/${locale}/project/${id}`} className="hover:text-stone-900 transition-colors">
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">Criteria &amp; Weights</span>
      </nav>

      {/* Search criteria */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Search Criteria</h2>
          <p className="mt-1 text-sm text-stone-500">
            Define what you are looking for. Properties will be evaluated against these parameters.
          </p>
        </div>
        <SearchCriteriaForm projectId={id} initial={criteria} projectType={project.project_type} />
      </section>

      <hr className="border-stone-100" />

      {/* Scoring weights */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Scoring Weights</h2>
          <p className="mt-1 text-sm text-stone-500">
            Adjust how each criterion contributes to the overall property score. Weights must sum to
            100%.
          </p>
        </div>
        <ScoringWeightsForm projectId={id} initial={weights} projectType={project.project_type} />
      </section>
    </main>
  );
}
