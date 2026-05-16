'use client';

import { useState } from 'react';
import type { ScoringResult, CriterionScore, OverallRating } from '@/types/scoring';
import { WEIGHT_KEYS } from '@/lib/scoring-criteria';

const CRITERION_LABELS: Record<string, string> = {
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

const RATING_CONFIG: Record<OverallRating, { label: string; className: string }> = {
  strong_candidate: { label: 'Strong Candidate', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  promising: { label: 'Promising', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  marginal: { label: 'Marginal', className: 'bg-orange-50 text-orange-800 border-orange-200' },
  not_recommended: { label: 'Not Recommended', className: 'bg-red-50 text-red-800 border-red-200' },
};

function scoreColor(raw: number): string {
  if (raw >= 7) return 'bg-emerald-500';
  if (raw >= 5) return 'bg-amber-500';
  return 'bg-red-400';
}

function ScoreBar({ score }: { score: CriterionScore }) {
  const label = CRITERION_LABELS[score.criterion] ?? score.criterion;
  const pct = (score.raw_score / 10) * 100;
  const weightPct = Math.round(score.weight * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-stone-700 font-medium">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-stone-400">{weightPct}%</span>
          <span className="text-sm font-bold text-stone-800 w-8 text-right">
            {score.raw_score.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(score.raw_score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {score.notes && (
        <p className="text-xs text-stone-400 leading-snug">{score.notes}</p>
      )}
    </div>
  );
}

interface Props {
  propertyId: string;
  initialScoring: ScoringResult | null;
}

export default function ScoringPanel({ propertyId, initialScoring }: Props) {
  const [scoring, setScoring] = useState<ScoringResult | null>(initialScoring);
  const [scoring_pending, setScoringPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScore() {
    setScoringPending(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'Scoring failed');
      else setScoring(json.scoring);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setScoringPending(false);
    }
  }

  const ratingConfig = scoring ? RATING_CONFIG[scoring.overall_rating] : null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-stone-900">Property Score</h2>
        <button
          onClick={handleScore}
          disabled={scoring_pending}
          className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {scoring_pending ? 'Scoring…' : scoring ? 'Re-score' : 'Score Property'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {scoring_pending && (
        <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-sm text-stone-600">Claude is scoring your property…</p>
        </div>
      )}

      {scoring && !scoring_pending && (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          {/* Header: overall rating + total score */}
          <div className="px-5 py-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold border ${ratingConfig!.className}`}>
                {ratingConfig!.label}
              </span>
              {scoring.red_flag_override && (
                <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  🔴 Downgraded for red flag
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-stone-900">{scoring.total_weighted_score}</p>
              <p className="text-xs text-stone-400">out of 100</p>
            </div>
          </div>

          {/* Score bars */}
          <div className="p-5 space-y-4">
            {WEIGHT_KEYS.map((k) => {
              const s = (scoring.scores as Record<string, CriterionScore>)[k];
              return s ? <ScoreBar key={k} score={s} /> : null;
            })}
          </div>

          <div className="px-5 pb-4 pt-0">
            <p className="text-xs text-stone-400">
              Scored by Claude · Weights are configurable per project · Re-score after adding AI analysis or scenarios.
            </p>
          </div>
        </div>
      )}

      {!scoring && !scoring_pending && (
        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
          <p className="text-sm text-stone-500">No score yet — click "Score Property" to run AI evaluation across 11 weighted criteria.</p>
        </div>
      )}
    </section>
  );
}
