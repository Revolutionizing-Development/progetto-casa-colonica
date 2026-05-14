import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/app/actions/projects';
import PropertyWizard from '@/components/property/PropertyWizard';

interface Props {
  params: { locale: string; id: string };
}

export default async function NewPropertyPage({ params: { locale, id } }: Props) {
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500 flex items-center gap-1.5 mb-8">
        <Link href={`/${locale}/dashboard`} className="hover:text-stone-900 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <Link href={`/${locale}/project/${id}`} className="hover:text-stone-900 transition-colors">
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">Add Property</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Add a Property</h1>
        <p className="text-stone-500 text-sm mt-1">
          9 steps · takes about 5 minutes · you can edit everything after creation
        </p>
      </div>

      <PropertyWizard projectId={id} locale={locale} />
    </main>
  );
}
