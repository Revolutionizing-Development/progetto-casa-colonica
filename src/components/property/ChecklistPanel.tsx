'use client';

import { useState, useMemo } from 'react';
import { OPERATIONAL_CHECKLISTS, PHASE_LABELS, PHASE_ORDER, type ChecklistItem } from '@/lib/checklists/operational';

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  important: 'bg-amber-50 text-amber-700 border-amber-200',
  recommended: 'bg-stone-50 text-stone-600 border-stone-200',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  important: 'Important',
  recommended: 'Recommended',
};

interface Props {
  pipelineStage: string;
}

export default function ChecklistPanel({ pipelineStage }: Props) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('checklist-completed');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const currentPhaseIndex = useMemo(() => {
    const stageToPhase: Record<string, string> = {
      scouted: 'pre_purchase',
      analyzing: 'pre_purchase',
      shortlisted: 'pre_purchase',
      site_visit: 'pre_purchase',
      negotiating: 'purchase',
      under_contract: 'purchase',
      closing: 'purchase',
      acquired: 'renovation',
      renovating: 'renovation',
      complete: 'ongoing',
    };
    const phase = stageToPhase[pipelineStage] ?? 'pre_purchase';
    return PHASE_ORDER.indexOf(phase as typeof PHASE_ORDER[number]);
  }, [pipelineStage]);

  function toggleItem(id: string) {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem('checklist-completed', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }

  const grouped = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    for (const phase of PHASE_ORDER) {
      groups[phase] = OPERATIONAL_CHECKLISTS.filter((item) => item.phase === phase);
    }
    return groups;
  }, []);

  const stats = useMemo(() => {
    const total = OPERATIONAL_CHECKLISTS.length;
    const done = OPERATIONAL_CHECKLISTS.filter((item) => completedItems.has(item.id)).length;
    const criticalRemaining = OPERATIONAL_CHECKLISTS.filter(
      (item) => item.priority === 'critical' && !completedItems.has(item.id)
    ).length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0, criticalRemaining };
  }, [completedItems]);

  const filteredPhases = filterPhase === 'all' ? [...PHASE_ORDER] : [filterPhase];

  return (
    <section className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{stats.done}/{stats.total}</span>
            <span className="text-sm text-stone-500">completed ({stats.pct}%)</span>
          </div>
          {stats.criticalRemaining > 0 && (
            <p className="text-xs text-red-600 mt-1">{stats.criticalRemaining} critical items remaining</p>
          )}
        </div>
        <div className="flex-1">
          <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">All phases</option>
          {PHASE_ORDER.map((phase) => (
            <option key={phase} value={phase}>{PHASE_LABELS[phase]}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded"
          />
          Show completed
        </label>
      </div>

      {/* Phases */}
      {filteredPhases.map((phase) => {
        const items = grouped[phase] ?? [];
        const visible = showCompleted ? items : items.filter((item) => !completedItems.has(item.id));
        if (visible.length === 0) return null;

        const phaseIdx = PHASE_ORDER.indexOf(phase as typeof PHASE_ORDER[number]);
        const isCurrentPhase = phaseIdx === currentPhaseIndex;
        const isPastPhase = phaseIdx < currentPhaseIndex;

        return (
          <div key={phase} className="rounded-xl border border-stone-200 overflow-hidden">
            <div className={`px-5 py-3 border-b border-stone-200 flex items-center justify-between ${
              isCurrentPhase ? 'bg-amber-50' : isPastPhase ? 'bg-stone-50' : 'bg-white'
            }`}>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-stone-700">{PHASE_LABELS[phase]}</h3>
                {isCurrentPhase && (
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Current</span>
                )}
              </div>
              <span className="text-xs text-stone-400">
                {items.filter((i) => completedItems.has(i.id)).length}/{items.length}
              </span>
            </div>
            <div className="divide-y divide-stone-100">
              {visible.map((item) => {
                const done = completedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-5 py-3 ${done ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                        done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {done && <span className="text-xs">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${done ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                          {item.title}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[item.priority]}`}>
                          {PRIORITY_LABELS[item.priority]}
                        </span>
                        {item.regulatory && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                            Regulatory
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 italic">{item.title_it}</p>
                      <p className="text-xs text-stone-500 mt-1">{item.description}</p>
                      {item.deadline_note && (
                        <p className="text-xs text-amber-600 mt-1">Deadline: {item.deadline_note}</p>
                      )}
                    </div>
                    <span className="text-xs text-stone-400 shrink-0">{item.category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
