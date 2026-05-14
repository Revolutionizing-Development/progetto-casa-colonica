'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createProject, type ProjectRow, type ActionResult } from '@/app/actions/projects';

interface Props {
  onCancel: () => void;
}

const initialState: ActionResult<ProjectRow> | null = null;

export default function NewProjectForm({ onCancel }: Props) {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createProject, initialState);
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
    <form action={formAction} className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-4">
      <h3 className="font-semibold text-stone-900">New Project</h3>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

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
