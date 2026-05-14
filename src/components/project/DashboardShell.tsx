'use client';

import { useState } from 'react';
import ProjectCard from './ProjectCard';
import NewProjectForm from './NewProjectForm';
import { type ProjectRow } from '@/app/actions/projects';

interface Props {
  projects: ProjectRow[];
}

export default function DashboardShell({ projects }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Projects</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-amber-700 text-white text-sm rounded-md hover:bg-amber-800 transition-colors"
          >
            New project
          </button>
        )}
      </div>

      {showForm && <NewProjectForm onCancel={() => setShowForm(false)} />}

      {projects.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center">
          <p className="text-stone-500 text-sm">No projects yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-amber-700 hover:underline"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: ProjectRow) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </main>
  );
}
