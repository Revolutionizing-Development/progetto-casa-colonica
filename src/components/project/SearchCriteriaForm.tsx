'use client';

import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { upsertSearchCriteria, type SearchCriteriaRow, type ActionResult } from '@/app/actions/search-criteria';
import { ITALIAN_REGIONS } from '@/config/regions';
import type { ProjectType } from '@/types/project';

interface Props {
  projectId: string;
  initial: SearchCriteriaRow | null;
  projectType?: ProjectType;
}

const initialState: ActionResult | null = null;

function EuroInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: number }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">€</span>
        <input
          name={name}
          type="number"
          min={0}
          step={1000}
          defaultValue={defaultValue || undefined}
          className="w-full rounded-md border border-stone-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function SqmInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: number }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      <div className="relative">
        <input
          name={name}
          type="number"
          min={0}
          step={10}
          defaultValue={defaultValue || undefined}
          className="w-full rounded-md border border-stone-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">m²</span>
      </div>
    </div>
  );
}

export default function SearchCriteriaForm({ projectId, initial, projectType = 'farmstead_hosting' }: Props) {
  const action = upsertSearchCriteria.bind(null, projectId);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(action, initialState);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => { formAction(data); });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{state.error}</p>
      )}
      {state?.data && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded">Saved.</p>
      )}

      {/* Budget */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Budget</h3>
        <div className="grid grid-cols-2 gap-4">
          <EuroInput name="max_purchase_price" label="Max purchase price" defaultValue={initial?.max_purchase_price} />
          <EuroInput name="max_all_in_cost" label="Max all-in cost" defaultValue={initial?.max_all_in_cost} />
        </div>
      </section>

      {/* Size */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Size</h3>
        <div className="grid grid-cols-3 gap-4">
          <SqmInput name="min_sqm_house" label="House min" defaultValue={initial?.min_sqm_house} />
          <SqmInput name="max_sqm_house" label="House max" defaultValue={initial?.max_sqm_house} />
          <SqmInput name="min_sqm_land" label="Land min" defaultValue={initial?.min_sqm_land} />
        </div>
      </section>

      {/* Regions */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Regions</h3>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
          {ITALIAN_REGIONS.map((region) => (
            <label key={region} className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                name="regions"
                value={region}
                defaultChecked={initial?.regions?.includes(region)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              {region}
            </label>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Requirements</h3>
        <div className="grid grid-cols-2 gap-y-2">
          {[
            { name: 'must_have_olive_grove', label: 'Must have olive grove' },
            { name: 'must_allow_animals', label: 'Must allow animals (livestock)' },
            { name: 'must_have_outbuildings', label: 'Must have outbuildings' },
            ...(projectType === 'farmstead_hosting'
              ? [{ name: 'requires_agriturismo_eligible', label: 'Must be Agriturismo eligible' }]
              : []),
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                name={name}
                defaultChecked={initial?.[name as keyof SearchCriteriaRow] as boolean}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2 bg-amber-700 text-white text-sm rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Saving…' : 'Save criteria'}
      </button>
    </form>
  );
}
