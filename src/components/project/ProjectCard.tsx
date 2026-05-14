'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';
import { deleteProject, type ProjectRow } from '@/app/actions/projects';

interface Props {
  project: ProjectRow;
}

export default function ProjectCard({ project }: Props) {
  const { locale } = useParams<{ locale: string }>();
  const [isPending, startTransition] = useTransition();

  const href = `/${locale}/project/${project.id}`;
  const date = new Date(project.updated_at).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    startTransition(async () => { await deleteProject(project.id); });
  }

  return (
    <Link
      href={href}
      className="group block rounded-lg border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-stone-900 truncate">{project.name}</h3>
          {project.description && (
            <p className="mt-1 text-sm text-stone-500 line-clamp-2">{project.description}</p>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all text-xs px-2 py-1 rounded"
          title="Delete project"
        >
          {isPending ? '…' : 'Delete'}
        </button>
      </div>

      <p className="mt-4 text-xs text-stone-400">Updated {date}</p>
    </Link>
  );
}
