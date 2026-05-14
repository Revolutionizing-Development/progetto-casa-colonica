import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/app/actions/projects';
import EditProjectForm from '@/components/project/EditProjectForm';

interface Props {
  params: { locale: string; id: string };
}

export default async function ProjectPage({ params: { locale, id } }: Props) {
  const project = await getProject(id);
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

      {/* Quick nav */}
      <div className="flex gap-3 border-t border-stone-100 pt-6">
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

      {/* Properties placeholder */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Properties</h2>
          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded">
            Coming in Build 6
          </span>
        </div>
        <div className="rounded-lg border border-dashed border-stone-200 p-10 text-center">
          <p className="text-stone-400 text-sm">
            Property intake is being built next. Add your first farmhouse listing to begin analysis.
          </p>
        </div>
      </section>
    </main>
  );
}
