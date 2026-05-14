'use client';

import { useActionState, useState } from 'react';
import { updateProject, type ProjectRow, type ActionResult } from '@/app/actions/projects';

interface Props {
  project: ProjectRow;
  locale: string;
}

const initialState: ActionResult<{ id: string }> | null = null;

export default function EditProjectForm({ project, locale: _locale }: Props) {
  const [editing, setEditing] = useState(false);
  const action = updateProject.bind(null, project.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (!editing) {
    return (
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-semibold text-stone-900">{project.name}</h1>
          <button
            onClick={() => setEditing(true)}
            className="mt-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            Edit
          </button>
        </div>
        {project.description && (
          <p className="text-stone-500">{project.description}</p>
        )}
        <p className="text-xs text-stone-400">
          Created {new Date(project.created_at).toLocaleDateString('en', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-stone-700">Project name</label>
        <input
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={project.name}
          autoFocus
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-stone-700">Description</label>
        <textarea
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={project.description ?? ''}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-amber-700 text-white text-sm rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-4 py-2 text-stone-600 text-sm rounded-md hover:bg-stone-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
