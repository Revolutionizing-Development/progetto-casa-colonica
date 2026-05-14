import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/app/actions/projects';

interface Props {
  params: { locale: string; id: string };
}

export default async function ComparePage({ params: { locale, id } }: Props) {
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <nav className="text-sm text-stone-500 flex items-center gap-1.5">
        <Link href={`/${locale}/dashboard`} className="hover:text-stone-900">Projects</Link>
        <span>/</span>
        <Link href={`/${locale}/project/${id}`} className="hover:text-stone-900">{project.name}</Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">Compare</span>
      </nav>

      <div className="rounded-lg border border-dashed border-stone-200 p-10 text-center">
        <p className="text-stone-400 text-sm">
          Property comparison matrix — coming in Build 11 (Scoring + comparison).
        </p>
      </div>
    </main>
  );
}
