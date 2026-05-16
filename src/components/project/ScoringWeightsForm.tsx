'use client';

import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import {
  upsertScoringWeights,
  type ScoringWeightsRow,
  type ActionResult,
} from '@/app/actions/scoring-weights';
import { WEIGHT_KEYS, HOMESTEAD_WEIGHT_KEYS, defaultWeightsPct, weightKeysForType, type WeightKey } from '@/lib/scoring-criteria';
import type { ProjectType } from '@/types/project';

const WEIGHT_LABELS: Record<string, string> = {
  purchase_price: 'Purchase Price',
  all_in_cost: 'All-In Cost',
  structural_condition: 'Structural Condition',
  airbnb_potential: 'Airbnb Potential',
  regulatory_risk: 'Regulatory Risk',
  lifestyle_fit: 'Lifestyle Fit',
  location_quality: 'Location Quality',
  land_characteristics: 'Land Characteristics',
  outbuilding_potential: 'Outbuilding Potential',
  negotiation_margin: 'Negotiation Margin',
  exit_value: 'Exit Value',
};

interface Props {
  projectId: string;
  initial: ScoringWeightsRow | null;
  projectType: ProjectType;
}

function rowToPct(row: ScoringWeightsRow | null, keys: readonly string[], projectType: ProjectType): Record<string, number> {
  if (!row) return defaultWeightsPct(projectType);
  return Object.fromEntries(
    keys.map((k) => [k, Math.round(((row as Record<string, number>)[k] ?? 0) * 100)]),
  );
}

const initialState: ActionResult | null = null;

export default function ScoringWeightsForm({ projectId, initial, projectType }: Props) {
  const keys = weightKeysForType(projectType);
  const action = upsertScoringWeights.bind(null, projectId);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(action, initialState);
  const [weights, setWeights] = useState<Record<string, number>>(rowToPct(initial, keys, projectType));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => { formAction(data); });
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = Math.abs(total - 100) < 0.1;

  function handleChange(key: string, value: string) {
    const num = Math.max(0, Math.min(100, parseInt(value) || 0));
    setWeights((prev) => ({ ...prev, [key]: num }));
  }

  const totalColor = isValid
    ? 'text-green-700'
    : total > 100
    ? 'text-red-600'
    : 'text-amber-600';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{state.error}</p>
      )}
      {state?.data && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded">Saved.</p>
      )}

      <div className="space-y-2">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-4">
            <span className="w-44 text-sm text-stone-700 shrink-0">{WEIGHT_LABELS[key]}</span>
            <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min(weights[key], 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <input
                name={key}
                type="number"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-14 rounded border border-stone-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="text-stone-400 text-sm">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <p className={`text-sm font-medium ${totalColor}`}>
          Total: {total}%{!isValid && ` (need ${100 - total > 0 ? '+' : ''}${100 - total}%)`}
        </p>
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={() => setWeights(defaultWeightsPct(projectType))}
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            Reset to defaults
          </button>
          <button
            type="submit"
            disabled={isPending || !isValid}
            className="px-5 py-2 bg-amber-700 text-white text-sm rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save weights'}
          </button>
        </div>
      </div>
    </form>
  );
}
