'use client';

import { useState, useMemo } from 'react';
import type { ComputedLineItem, PhaseYear, PhaseAssignments } from '@/types/cost-config';
import type { HouseholdProfile } from '@/types/household';
import { buildInflowsFromProfile } from '@/lib/financial/timeline-calculator';

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

export const YEAR_LABELS: Record<PhaseYear, string> = {
  1: 'Year 1 — Core Renovation',
  2: 'Year 2 — Systems & Completion',
  3: 'Year 3 — Move & Finishes',
  4: 'Year 4 — Lifestyle & Deferred',
};

export const YEAR_COLORS: Record<PhaseYear, { bg: string; border: string; text: string; badge: string; bar: string }> = {
  1: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400' },
  2: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-400' },
  3: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-400' },
  4: { bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-600', badge: 'bg-stone-100 text-stone-600', bar: 'bg-stone-300' },
};

export const YEAR_SUBTITLES: Record<PhaseYear, string> = {
  1: 'US — Remote managed',
  2: 'US — Remote managed',
  3: 'Italy — On-site DIY',
  4: 'Italy — On-site DIY',
};

const DEFAULT_CARRYING_COST_MONTHLY = 1250;

function PhaseItemRow({
  item,
  onMoveToPhase,
}: {
  item: ComputedLineItem;
  onMoveToPhase: (key: string, phase: PhaseYear) => void;
}) {
  const otherPhases = ([1, 2, 3, 4] as PhaseYear[]).filter((p) => p !== item.phaseYear);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-700 truncate">{item.description}</span>
          {item.isRegulated && (
            <span className="text-xs px-1 py-0.5 rounded bg-red-50 text-red-600 shrink-0">Reg.</span>
          )}
          {item.diyEnabled && (
            <span className="text-xs px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">DIY</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-stone-700 font-medium tabular-nums">
          €{fmt(item.effectiveCost)}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {otherPhases.map((phase) => (
            <button
              key={phase}
              onClick={() => onMoveToPhase(item.key, phase)}
              className={`text-xs px-2 py-1 rounded ${YEAR_COLORS[phase].badge} hover:opacity-80 transition-opacity`}
              title={`Move to ${YEAR_LABELS[phase]}`}
            >
              Y{phase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseBucket({
  phase,
  items,
  onMoveToPhase,
}: {
  phase: PhaseYear;
  items: ComputedLineItem[];
  onMoveToPhase: (key: string, phase: PhaseYear) => void;
}) {
  const [open, setOpen] = useState(phase <= 2);
  const colors = YEAR_COLORS[phase];
  const total = items.reduce((s, i) => s + i.effectiveCost, 0);
  const diySavings = items.reduce((s, i) => s + i.diySavings, 0);
  const ongoingItems = items.filter((i) => i.isOngoing);
  const oneTimeItems = items.filter((i) => !i.isOngoing);

  return (
    <div className={`rounded-xl border ${colors.border} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 ${colors.bg} hover:opacity-90 transition-opacity text-left`}
      >
        <div>
          <h4 className={`text-sm font-semibold ${colors.text}`}>{YEAR_LABELS[phase]}</h4>
          <p className="text-xs text-stone-500 mt-0.5">
            {YEAR_SUBTITLES[phase]} · {oneTimeItems.length} items
            {ongoingItems.length > 0 && ` + ${ongoingItems.length} ongoing`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-sm font-bold ${colors.text} tabular-nums`}>€{fmt(total)}</p>
            {diySavings > 0 && (
              <p className="text-xs text-emerald-600">–€{fmt(diySavings)} DIY</p>
            )}
          </div>
          <span className="text-stone-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className={`px-3 py-2 ${colors.bg} bg-opacity-30`}>
          {oneTimeItems.length > 0 && (
            <div className="space-y-0.5">
              {oneTimeItems.map((item) => (
                <PhaseItemRow key={item.key} item={item} onMoveToPhase={onMoveToPhase} />
              ))}
            </div>
          )}

          {ongoingItems.length > 0 && (
            <>
              <div className="border-t border-stone-200 mt-2 pt-2">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide px-3 mb-1">
                  Ongoing costs
                </p>
                {ongoingItems.map((item) => (
                  <PhaseItemRow key={item.key} item={item} onMoveToPhase={onMoveToPhase} />
                ))}
              </div>
            </>
          )}

          {items.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-4">
              No items in this phase. Hover items above to move them here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface AnnualCashRow {
  year: PhaseYear;
  purchaseCost: number;
  renovationSpend: number;
  carryingCosts: number;
  livingCosts: number;
  totalOutflow: number;
  fundingInflow: number;
  netCashNeeded: number;
}

function computeAnnualCash(
  yearTotals: number[],
  purchasePrice: number,
  hp: HouseholdProfile,
): AnnualCashRow[] {
  const inflows = buildInflowsFromProfile(hp);
  const carryingMonthly = DEFAULT_CARRYING_COST_MONTHLY;
  const livingMonthly = Math.round(hp.annual_living_costs / 12);
  const moveMonth = hp.us_phase_months;

  return ([1, 2, 3, 4] as PhaseYear[]).map((yr) => {
    const purchaseCost = yr === 1 ? purchasePrice : 0;
    const renovationSpend = yearTotals[yr - 1];
    const carryingCosts = carryingMonthly * 12;

    const yearStart = (yr - 1) * 12 + 1;
    const yearEnd = yr * 12;
    let livingMonths = 0;
    for (let m = yearStart; m <= yearEnd; m++) {
      if (m > moveMonth) livingMonths++;
    }
    const livingCosts = livingMonthly * livingMonths;
    const totalOutflow = purchaseCost + renovationSpend + carryingCosts + livingCosts;

    const fundingInflow = inflows.reduce((sum, inflow) => {
      const yearStart = (yr - 1) * 12 + 1;
      const yearEnd = yr * 12;
      let months = 0;
      for (let m = yearStart; m <= yearEnd; m++) {
        if (m >= inflow.startMonth && m <= inflow.endMonth) months++;
      }
      return sum + inflow.monthlyAmount * months;
    }, 0);

    return {
      year: yr,
      purchaseCost,
      renovationSpend,
      carryingCosts,
      livingCosts,
      totalOutflow,
      fundingInflow,
      netCashNeeded: totalOutflow - fundingInflow,
    };
  });
}

interface Props {
  items: ComputedLineItem[];
  phaseAssignments: PhaseAssignments;
  purchasePrice: number;
  householdProfile: HouseholdProfile;
  onChange: (assignments: PhaseAssignments) => void;
}

export default function PhaseTimeline({ items, phaseAssignments, purchasePrice, householdProfile, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  const phase1 = items.filter((i) => i.phaseYear === 1);
  const phase2 = items.filter((i) => i.phaseYear === 2);
  const phase3 = items.filter((i) => i.phaseYear === 3);
  const phase4 = items.filter((i) => i.phaseYear === 4);

  const totals = [phase1, phase2, phase3, phase4].map((p) =>
    p.reduce((s, i) => s + i.effectiveCost, 0),
  );
  const grandTotal = totals[0] + totals[1] + totals[2] + totals[3];

  const annualCash = useMemo(
    () => computeAnnualCash(totals, purchasePrice, householdProfile),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totals[0], totals[1], totals[2], totals[3], purchasePrice, householdProfile],
  );
  const totalCashNeeded = annualCash.reduce((s, r) => s + Math.max(0, r.netCashNeeded), 0);

  function handleMoveToPhase(key: string, phase: PhaseYear) {
    onChange({ ...phaseAssignments, [key]: phase });
  }

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Phasing — 4-Year Plan</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Spread costs across years — hover items to reassign
          </p>
        </div>
        <span className="text-stone-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-4">
          {/* Summary bar */}
          <div className="flex h-6 rounded-full overflow-hidden border border-stone-200">
            {grandTotal > 0 && (
              <>
                {([1, 2, 3, 4] as PhaseYear[]).map((yr) => {
                  const pct = (totals[yr - 1] / grandTotal) * 100;
                  return (
                    <div
                      key={yr}
                      className={`${YEAR_COLORS[yr].bar} flex items-center justify-center`}
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 12 && (
                        <span className={`text-xs font-bold ${yr <= 2 ? 'text-white' : yr === 3 ? 'text-emerald-900' : 'text-stone-600'}`}>
                          Y{yr}
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Per-year renovation totals */}
          <div className="grid grid-cols-4 gap-3 text-center">
            {([1, 2, 3, 4] as PhaseYear[]).map((yr) => (
              <div key={yr}>
                <p className="text-xs text-stone-400">Year {yr}</p>
                <p className={`text-sm font-bold ${YEAR_COLORS[yr].text} tabular-nums`}>
                  €{fmt(totals[yr - 1])}
                </p>
              </div>
            ))}
          </div>

          {/* Annual cash summary */}
          <div className="rounded-lg border border-stone-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-stone-700">Annual Cash Flow</p>
              <p className="text-xs text-stone-500">
                Total net: <span className="font-bold text-stone-800">€{fmt(totalCashNeeded)}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-3 py-2 text-stone-400 font-medium" />
                    {([1, 2, 3, 4] as PhaseYear[]).map((yr) => (
                      <th key={yr} className={`text-right px-3 py-2 font-semibold ${YEAR_COLORS[yr].text}`}>
                        Y{yr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchasePrice > 0 && (
                    <tr className="border-b border-stone-50">
                      <td className="px-3 py-1.5 text-stone-600">Purchase</td>
                      {annualCash.map((r) => (
                        <td key={r.year} className="text-right px-3 py-1.5 tabular-nums text-stone-700">
                          {r.purchaseCost > 0 ? `€${fmt(r.purchaseCost)}` : '—'}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr className="border-b border-stone-50">
                    <td className="px-3 py-1.5 text-stone-600">Renovation</td>
                    {annualCash.map((r) => (
                      <td key={r.year} className="text-right px-3 py-1.5 tabular-nums text-stone-700">
                        €{fmt(r.renovationSpend)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-stone-50">
                    <td className="px-3 py-1.5 text-stone-600">Carrying costs</td>
                    {annualCash.map((r) => (
                      <td key={r.year} className="text-right px-3 py-1.5 tabular-nums text-stone-500">
                        €{fmt(r.carryingCosts)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-stone-50">
                    <td className="px-3 py-1.5 text-stone-600">Living costs</td>
                    {annualCash.map((r) => (
                      <td key={r.year} className="text-right px-3 py-1.5 tabular-nums text-stone-500">
                        {r.livingCosts > 0 ? `€${fmt(r.livingCosts)}` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <td className="px-3 py-1.5 text-stone-700 font-medium">Total outflow</td>
                    {annualCash.map((r) => (
                      <td key={r.year} className="text-right px-3 py-1.5 tabular-nums font-semibold text-stone-800">
                        €{fmt(r.totalOutflow)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-stone-50">
                    <td className="px-3 py-1.5 text-emerald-700">Funding inflow</td>
                    {annualCash.map((r) => (
                      <td key={r.year} className="text-right px-3 py-1.5 tabular-nums text-emerald-600">
                        +€{fmt(r.fundingInflow)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="px-3 py-2 text-amber-800 font-bold">Net cash needed</td>
                    {annualCash.map((r) => (
                      <td key={r.year} className={`text-right px-3 py-2 tabular-nums font-bold ${r.netCashNeeded > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {r.netCashNeeded > 0 ? '' : '+'}€{fmt(Math.abs(r.netCashNeeded))}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Phase buckets */}
          <PhaseBucket phase={1} items={phase1} onMoveToPhase={handleMoveToPhase} />
          <PhaseBucket phase={2} items={phase2} onMoveToPhase={handleMoveToPhase} />
          <PhaseBucket phase={3} items={phase3} onMoveToPhase={handleMoveToPhase} />
          <PhaseBucket phase={4} items={phase4} onMoveToPhase={handleMoveToPhase} />
        </div>
      )}
    </div>
  );
}
