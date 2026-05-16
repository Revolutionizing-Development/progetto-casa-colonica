'use client';

import { useState } from 'react';
import type { QuickScanResult } from '@/lib/ai/prompts/quickscan';

interface Props {
  propertyId: string;
  initial: QuickScanResult | null;
}

type Status = 'idle' | 'scanning' | 'done' | 'error';

const VERDICT_CONFIG = {
  pass: {
    emoji: '✅',
    label: 'Worth investigating',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    textLight: 'text-green-600',
  },
  maybe: {
    emoji: '🟡',
    label: 'Has concerns',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    textLight: 'text-amber-600',
  },
  fail: {
    emoji: '🔴',
    label: 'Skip this one',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    textLight: 'text-red-600',
  },
};

const RENOVATION_LABELS: Record<string, string> = {
  cosmetic: 'Cosmetic refresh',
  moderate: 'Moderate renovation',
  heavy: 'Heavy renovation',
  structural_rebuild: 'Structural rebuild',
};

const PRICE_LABELS: Record<string, { label: string; color: string }> = {
  bargain: { label: 'Bargain', color: 'text-green-700 bg-green-50' },
  fair: { label: 'Fair price', color: 'text-stone-700 bg-stone-50' },
  overpriced: { label: 'Overpriced', color: 'text-red-700 bg-red-50' },
  insufficient_data: { label: 'Insufficient data', color: 'text-stone-400 bg-stone-50' },
};

const NEXT_LABELS: Record<string, string> = {
  full_analysis: 'Proceed to full AI analysis',
  skip: 'Not recommended — skip this property',
  investigate_first: 'Investigate specific concerns first',
};

export default function QuickScanPanel({ propertyId, initial }: Props) {
  const [status, setStatus] = useState<Status>(initial ? 'done' : 'idle');
  const [result, setResult] = useState<QuickScanResult | null>(initial);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function runQuickScan() {
    setStatus('scanning');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/quickscan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'QuickScan failed');
        setStatus('error');
        return;
      }

      setResult(data.quickscan);
      setStatus('done');
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus('error');
    }
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-stone-900">QuickScan</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Fast AI triage — pass/fail in ~10 seconds, 10x cheaper than full analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <span className="text-xs text-stone-400">
              {new Date(result.scanned_at).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={runQuickScan}
            disabled={status === 'scanning'}
            className="px-3 py-1.5 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'scanning'
              ? '⟳ Scanning…'
              : result
              ? 'Re-scan'
              : 'QuickScan'}
          </button>
        </div>
      </div>

      {/* Scanning state */}
      {status === 'scanning' && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center">
          <div className="text-xl mb-2 animate-pulse">🔍</div>
          <p className="text-sm font-medium text-stone-700">Running QuickScan…</p>
          <p className="text-xs text-stone-400 mt-1">Fast triage takes about 10 seconds.</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>QuickScan failed:</strong> {errorMsg}
        </div>
      )}

      {/* Idle — no scan yet */}
      {status === 'idle' && (
        <div className="rounded-lg border-2 border-dashed border-stone-200 p-6 text-center">
          <p className="text-stone-400 text-sm mb-1">No QuickScan yet</p>
          <p className="text-xs text-stone-300">
            Run a fast AI triage before committing to the full 60-120 second analysis.
            Uses a lightweight model — costs ~10x less.
          </p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <QuickScanCard result={result} />
      )}
    </section>
  );
}

function QuickScanCard({ result }: { result: QuickScanResult }) {
  const vc = VERDICT_CONFIG[result.verdict];
  const price = PRICE_LABELS[result.price_assessment] ?? PRICE_LABELS.insufficient_data;

  return (
    <div className={`rounded-xl border ${vc.border} ${vc.bg} overflow-hidden`}>
      {/* Verdict header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{vc.emoji}</span>
          <div>
            <span className={`text-lg font-bold ${vc.text}`}>{vc.label}</span>
            <p className={`text-sm mt-0.5 ${vc.textLight}`}>{result.verdict_reason}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${price.color} border border-stone-200`}>
            {price.label}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            {RENOVATION_LABELS[result.renovation_tier] ?? result.renovation_tier}
          </span>
        </div>
      </div>

      {/* Observations */}
      <div className="px-5 pb-4 space-y-3">
        {result.observations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Key Observations
            </p>
            <ul className="space-y-1">
              {result.observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="text-stone-400 shrink-0 mt-0.5">▸</span>
                  {obs}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deal breakers */}
        {result.deal_breakers.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-800 mb-1">Deal Breakers</p>
            <ul className="space-y-1">
              {result.deal_breakers.map((db, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  {db}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-200/60">
          <span className="text-xs text-stone-500">Next step:</span>
          <span className="text-xs font-medium text-stone-700">
            {NEXT_LABELS[result.recommended_next] ?? result.recommended_next}
          </span>
        </div>
      </div>
    </div>
  );
}
