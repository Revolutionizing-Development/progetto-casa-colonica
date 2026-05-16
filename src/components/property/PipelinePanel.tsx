'use client';

import { useState, useTransition } from 'react';
import { advancePipelineStage, retreatPipelineStage } from '@/app/actions/pipeline';
import { STAGE_ORDER } from '@/lib/pipeline-stages';
import type { PipelineEvent, PipelineStage } from '@/lib/pipeline-stages';

const STAGE_LABELS: Record<PipelineStage, string> = {
  scouted: 'Scouted',
  analyzing: 'Analyzing',
  shortlisted: 'Shortlisted',
  site_visit: 'Site Visit',
  negotiating: 'Negotiating',
  under_contract: 'Under Contract',
  closing: 'Closing',
  acquired: 'Acquired',
  renovating: 'Renovating',
  complete: 'Complete',
};

// Guidance checklist shown before advancing FROM each stage
const ADVANCE_CHECKLIST: Record<string, string[]> = {
  analyzing: [
    'AI structural + regulatory analysis reviewed',
    'All red regulatory flags understood',
    'Property worth pursuing to site visit stage',
  ],
  shortlisted: [
    'Site visit scheduled with local agent or geometra',
    'Travel logistics confirmed',
    'Key questions for site visit prepared',
  ],
  site_visit: [
    'On-site structural inspection complete',
    'Water, electricity, and septic access checked',
    'Neighborhood and road access assessed',
    'Commune planning history enquired',
  ],
  negotiating: [
    'Preliminary offer terms agreed with agent',
    'Compromesso (preliminary contract) terms reviewed',
    'Caparra (deposit) amount and conditions agreed',
    'Notaio (notary) identified and engaged',
  ],
  under_contract: [
    'Visura ipotecaria (mortgage check) confirmed clear',
    'Conformità urbanistica (planning compliance) verified',
    'Rogito (final deed) date confirmed with notaio',
    'Wire transfer arranged (purchase price + taxes)',
    'Codice fiscale (Italian tax ID) obtained',
  ],
  closing: [
    'Rogito signed at notaio office',
    'Keys received',
    'Property registered at Catasto and Agenzia Entrate',
    'Utilities transferred to your name',
  ],
  acquired: [
    'Renovation contractor and geometra appointed',
    'Permits obtained (CILA/SCIA as required)',
    'Renovation budget and timeline confirmed',
    'Construction and property insurance in place',
  ],
  renovating: [
    'Collaudo (final technical inspection) passed',
    'Agibilità (habitability certificate) issued',
    'All utilities fully operational',
    'Catasto updated to reflect renovated state',
  ],
};

interface Props {
  propertyId: string;
  currentStage: PipelineStage;
  hasAnalysis: boolean;
  hasRedFlag: boolean;
  history: PipelineEvent[];
}

export default function PipelinePanel({
  propertyId,
  currentStage,
  hasAnalysis,
  hasRedFlag,
  history,
}: Props) {
  const [stage, setStage] = useState<PipelineStage>(currentStage);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showRetreat, setShowRetreat] = useState(false);
  const [retreatReason, setRetreatReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>(history);
  const [isPending, startTransition] = useTransition();

  const currentIndex = STAGE_ORDER.indexOf(stage);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STAGE_ORDER.length - 1;
  const nextStage = !isLast ? STAGE_ORDER[currentIndex + 1] : null;
  const prevStage = !isFirst ? STAGE_ORDER[currentIndex - 1] : null;

  // Hard gate: analyzing → shortlisted requires analysis
  const hardGateBlocked = stage === 'analyzing' && !hasAnalysis;
  // Soft warning: red flag present
  const redFlagWarning = stage === 'analyzing' && hasAnalysis && hasRedFlag;

  const checklist = ADVANCE_CHECKLIST[stage] ?? [];

  function handleAdvance() {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await advancePipelineStage(
        propertyId,
        showOverride ? overrideReason : undefined,
      );
      if (result.success && result.newStage) {
        setStage(result.newStage as PipelineStage);
        setShowOverride(false);
        setOverrideReason('');
        // Refresh history by re-fetching would require server round-trip;
        // add optimistic event instead
        setEvents((prev) => [
          {
            id: crypto.randomUUID(),
            property_id: propertyId,
            from_stage: stage,
            to_stage: result.newStage!,
            triggered_by: 'user',
            gate_overridden: showOverride && !!overrideReason,
            gate_override_reason: showOverride ? overrideReason : null,
            notes: null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setErrorMsg(result.error ?? 'Advance failed');
      }
    });
  }

  function handleRetreat() {
    if (!retreatReason.trim()) {
      setErrorMsg('Reason is required to go back a stage.');
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const result = await retreatPipelineStage(propertyId, retreatReason);
      if (result.success && result.newStage) {
        setStage(result.newStage as PipelineStage);
        setShowRetreat(false);
        setRetreatReason('');
        setEvents((prev) => [
          {
            id: crypto.randomUUID(),
            property_id: propertyId,
            from_stage: stage,
            to_stage: result.newStage!,
            triggered_by: 'user',
            gate_overridden: false,
            gate_override_reason: retreatReason,
            notes: 'Stage retreated',
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setErrorMsg(result.error ?? 'Retreat failed');
      }
    });
  }

  return (
    <section className="space-y-8">
      {/* Stage rail */}
      <div>
        <h2 className="text-base font-semibold text-stone-900 mb-5">Pipeline</h2>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-200" />
          <div
            className="absolute top-4 left-4 h-0.5 bg-amber-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (STAGE_ORDER.length - 1)) * (100 - (8 / STAGE_ORDER.length))}%` }}
          />
          <ol className="relative flex justify-between">
            {STAGE_ORDER.map((s, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <li key={s} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / STAGE_ORDER.length}%` }}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-colors ${
                      done
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : active
                        ? 'bg-white border-amber-600 text-amber-700'
                        : 'bg-white border-stone-300 text-stone-400'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-center leading-tight hidden sm:block ${
                      active
                        ? 'text-xs font-semibold text-amber-700'
                        : done
                        ? 'text-xs text-stone-500'
                        : 'text-xs text-stone-400'
                    }`}
                    style={{ fontSize: '10px' }}
                  >
                    {STAGE_LABELS[s]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-4 text-center sm:text-left text-sm font-medium text-stone-700">
          Current stage: <span className="text-amber-700">{STAGE_LABELS[stage]}</span>
        </p>
      </div>

      {/* Advance section */}
      {!isLast && nextStage && (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">
                Advance to: <span className="text-amber-700">{STAGE_LABELS[nextStage]}</span>
              </h3>
              {stage === 'scouted' && (
                <p className="text-xs text-stone-500 mt-0.5">
                  This stage advances automatically when you run AI analysis.
                </p>
              )}
            </div>
          </div>

          {stage !== 'scouted' && (
            <div className="p-5 space-y-5">
              {/* Checklist */}
              {checklist.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
                    Before advancing — confirm you have:
                  </p>
                  <ul className="space-y-2">
                    {checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                        <span className="mt-0.5 w-4 h-4 rounded border border-stone-300 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hard gate warning */}
              {hardGateBlocked && !showOverride && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
                  <div>
                    <p className="text-sm font-semibold text-red-800">AI analysis required</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Run the AI analysis first, or use the override below to proceed without it.
                    </p>
                  </div>
                </div>
              )}

              {/* Red flag warning */}
              {redFlagWarning && !showOverride && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <span className="text-amber-600 shrink-0 mt-0.5">🔴</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Red regulatory flag active</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      At least one regulatory category is red. Investigate before shortlisting, or proceed with awareness.
                    </p>
                  </div>
                </div>
              )}

              {/* Override toggle */}
              <div>
                <button
                  className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2"
                  onClick={() => setShowOverride((v) => !v)}
                >
                  {showOverride ? 'Cancel override' : 'Override gate'}
                </button>
                {showOverride && (
                  <textarea
                    className="mt-2 w-full rounded-lg border border-stone-200 p-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    rows={2}
                    placeholder="Explain why you are proceeding without meeting all criteria…"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                )}
              </div>

              {/* Error */}
              {errorMsg && !showRetreat && (
                <p className="text-sm text-red-600">{errorMsg}</p>
              )}

              {/* Advance button */}
              <button
                onClick={handleAdvance}
                disabled={isPending || (hardGateBlocked && (!showOverride || !overrideReason.trim()))}
                className="w-full px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Advancing…' : `Advance to ${STAGE_LABELS[nextStage]} →`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Terminal stage */}
      {isLast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-lg font-semibold text-emerald-800">🎉 Complete</p>
          <p className="text-sm text-emerald-700 mt-1">This property has reached the final pipeline stage.</p>
        </div>
      )}

      {/* Retreat section */}
      {!isFirst && (
        <div>
          {!showRetreat ? (
            <button
              className="text-xs text-stone-400 hover:text-stone-500 underline underline-offset-2"
              onClick={() => { setShowRetreat(true); setErrorMsg(null); }}
            >
              ← Go back to {prevStage ? STAGE_LABELS[prevStage] : ''}
            </button>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
              <p className="text-sm font-semibold text-stone-700">
                Go back to {prevStage ? STAGE_LABELS[prevStage] : ''}
              </p>
              <textarea
                className="w-full rounded-lg border border-stone-200 p-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                rows={2}
                placeholder="Why are you stepping back? (required)"
                value={retreatReason}
                onChange={(e) => setRetreatReason(e.target.value)}
              />
              {errorMsg && showRetreat && (
                <p className="text-sm text-red-600">{errorMsg}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleRetreat}
                  disabled={isPending || !retreatReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? 'Moving…' : 'Confirm retreat'}
                </button>
                <button
                  onClick={() => { setShowRetreat(false); setRetreatReason(''); setErrorMsg(null); }}
                  className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event history */}
      {events.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">
            Stage History
          </h3>
          <ol className="relative border-l border-stone-200 space-y-5 ml-2">
            {events.map((ev) => (
              <li key={ev.id} className="ml-4">
                <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-stone-300 border-2 border-white" />
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-stone-800">
                    {ev.from_stage ? `${STAGE_LABELS[ev.from_stage as PipelineStage] ?? ev.from_stage} → ` : ''}
                    {STAGE_LABELS[ev.to_stage as PipelineStage] ?? ev.to_stage}
                  </span>
                  {ev.gate_overridden && (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-medium">
                      Gate overridden
                    </span>
                  )}
                  {ev.notes === 'Stage retreated' && (
                    <span className="text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                      ← Retreat
                    </span>
                  )}
                </div>
                {ev.gate_override_reason && (
                  <p className="text-xs text-stone-500 mt-0.5 italic">"{ev.gate_override_reason}"</p>
                )}
                <p className="text-xs text-stone-400 mt-0.5">
                  {new Date(ev.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
