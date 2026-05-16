import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/app/actions/projects';
import { getHouseholdProfile } from '@/app/actions/household';
import NewPropertyClient from '@/components/property/NewPropertyClient';

interface Props {
  params: { locale: string; id: string };
}

export default async function NewPropertyPage({ params: { locale, id } }: Props) {
  const [project, profile] = await Promise.all([
    getProject(id),
    getHouseholdProfile(),
  ]);
  if (!project) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
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

      <NewPropertyClient
        projectId={id}
        locale={locale}
        importFolder={profile.import_folder ?? undefined}
      />
    </main>
  );
}
