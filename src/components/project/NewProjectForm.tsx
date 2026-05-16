'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { createProject, type ProjectRow, type ActionResult, type ProjectType } from '@/app/actions/projects';

interface Props {
  onCancel: () => void;
}

const initialState: ActionResult<ProjectRow> | null = null;

export default function NewProjectForm({ onCancel }: Props) {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(createProject, initialState);
  const [projectType, setProjectType] = useState<ProjectType>('farmstead_hosting');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => { formAction(data); });
  }
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state?.data) {
      router.push(`/${locale}/project/${state.data.id}`);
    }
  }, [state, locale, router]);

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-4">
      <h3 className="font-semibold text-stone-900">New Project</h3>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <input type="hidden" name="project_type" value={projectType} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-stone-700">
          Project type <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={`flex flex-col gap-1 cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              projectType === 'farmstead_hosting'
                ? 'border-amber-600 bg-amber-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <input
              type="radio"
              name="_project_type_radio"
              value="farmstead_hosting"
              checked={projectType === 'farmstead_hosting'}
              onChange={() => setProjectType('farmstead_hosting')}
              className="sr-only"
            />
            <span className="font-semibold text-stone-900 text-sm">Farmstead + Hosting</span>
            <span className="text-xs text-stone-500">Airbnb apartments, agriturismo, experiences, full scope with income projections</span>
          </label>
          <label
            className={`flex flex-col gap-1 cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              projectType === 'private_homestead'
                ? 'border-amber-600 bg-amber-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <input
              type="radio"
              name="_project_type_radio"
              value="private_homestead"
              checked={projectType === 'private_homestead'}
              onChange={() => setProjectType('private_homestead')}
              className="sr-only"
            />
            <span className="font-semibold text-stone-900 text-sm">Private Homestead</span>
            <span className="text-xs text-stone-500">No guests, no income — simpler renovation scope, personal use only</span>
          </label>
        </div>
      </fieldset>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-stone-700" htmlFor="name">
          Project name <span className="text-red-500">*</span>
        </label>
        <input
          ref={nameRef}
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder="Tuscany Search 2026"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-stone-700" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={500}
          placeholder="Looking for a 600m² farmhouse in Umbria or Tuscany…"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-amber-700 text-white text-sm rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Creating…' : 'Create project'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-stone-600 text-sm rounded-md hover:bg-stone-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
