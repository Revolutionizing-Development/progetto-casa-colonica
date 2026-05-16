'use client';

import { useState, useMemo } from 'react';
import type { ScenarioCostSummary } from '@/types/cost-config';
import type { DecisionGate, FundingInflow, MonthlySnapshot, LiquidityWarning } from '@/types/timeline';
import {
  buildDefaultPhases,
  computeMonthlySnapshots,
  findLiquidityWarnings,
  buildInflowsFromProfile,
  buildGatesFromProfile,
} from '@/lib/financial/timeline-calculator';
import { YEAR_COLORS, YEAR_LABELS, YEAR_SUBTITLES } from '@/components/costs/PhaseTimeline';
import type { PhaseYear } from '@/types/cost-config';
import type { HouseholdProfile } from '@/types/household';
import { HOUSEHOLD_DEFAULTS } from '@/types/household';

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function monthToYear(month: number): PhaseYear {
  const yr = Math.ceil(month / 12);
  return Math.min(yr, 4) as PhaseYear;
}

const TOTAL_MONTHS = 48;

interface Props {
  costSummary: ScenarioCostSummary;
  purchasePrice?: number;
  householdProfile?: HouseholdProfile;
  carryingCostMonthly?: number;
}

export default function ProjectTimeline({
  costSummary,
  purchasePrice = 0,
  householdProfile,
  carryingCostMonthly = 1250,
}: Props) {
  const hp = householdProfile ?? { ...HOUSEHOLD_DEFAULTS, id: '', user_id: '', created_at: '', updated_at: '' } as HouseholdProfile;
  const initialCash = hp.starting_cash;
  const livingCostMonthly = Math.round(hp.annual_living_costs / 12);
  const gates = useMemo(() => buildGatesFromProfile(hp), [hp]);
  const inflows = useMemo(() => buildInflowsFromProfile(hp), [hp]);
  const [showCashFlow, setShowCashFlow] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const phases = useMemo(() => buildDefaultPhases(costSummary, purchasePrice), [costSummary, purchasePrice]);

  const snapshots = useMemo(
    () =>
      computeMonthlySnapshots({
        phases,
        gates,
        inflows,
        initialCash,
        carryingCostMonthly,
        livingCostMonthly,
        moveMonth: hp.us_phase_months,
        totalMonths: TOTAL_MONTHS,
      }),
    [phases, gates, inflows, initialCash, carryingCostMonthly, livingCostMonthly, hp.us_phase_months],
  );

  const warnings = useMemo(
    () => findLiquidityWarnings(snapshots, phases),
    [snapshots, phases],
  );

  const maxCash = Math.max(...snapshots.map((s) => s.cashRemaining), initialCash);
  const minCash = Math.min(...snapshots.map((s) => s.cashRemaining), 0);
  const cashRange = maxCash - minCash || 1;

  const hoveredSnap = hoveredMonth ? snapshots[hoveredMonth - 1] : null;

  const yearlySummary = useMemo(() => {
    return ([1, 2, 3, 4] as PhaseYear[]).map((yr) => {
      const yearSnapshots = snapshots.filter((s) => s.year === yr);
      return {
        year: yr,
        totalSpend: yearSnapshots.reduce((s, snap) => s + snap.phaseSpend, 0),
        totalOutflow: yearSnapshots.reduce((s, snap) => s + snap.totalOutflow, 0),
        totalInflow: yearSnapshots.reduce((s, snap) => s + snap.fundingInflow, 0),
        endCash: yearSnapshots[yearSnapshots.length - 1]?.cashRemaining ?? 0,
      };
    });
  }, [snapshots]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-stone-900">Project Timeline</h3>
          <p className="text-sm text-stone-500 mt-0.5">
            48-month renovation plan with cash flow tracking
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showCashFlow}
            onChange={(e) => setShowCashFlow(e.target.checked)}
            className="accent-amber-600"
          />
          Show cash flow
        </label>
      </div>

      {/* Liquidity warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-800 mb-1">Liquidity Warning</p>
          {warnings.map((w) => (
            <p key={w.phaseId} className="text-xs text-red-700">
              {w.suggestion} (shortfall: €{fmt(w.shortfall)})
            </p>
          ))}
        </div>
      )}

      {/* Annual summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {yearlySummary.map((ys) => {
          const colors = YEAR_COLORS[ys.year];
          return (
            <div key={ys.year} className={`rounded-lg border ${colors.border} ${colors.bg} px-3 py-2.5`}>
              <p className={`text-xs font-semibold ${colors.text}`}>Y{ys.year}</p>
              <p className="text-[10px] text-stone-400 mb-1.5">{YEAR_SUBTITLES[ys.year]}</p>
              <p className={`text-sm font-bold ${colors.text} tabular-nums`}>€{fmt(ys.totalSpend)}</p>
              <p className="text-[10px] text-stone-400">renovation</p>
              <div className="border-t border-stone-200/50 mt-1.5 pt-1.5">
                <p className={`text-xs tabular-nums ${ys.endCash >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  €{fmt(ys.endCash)} remaining
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Year headers + management mode */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Year labels + location bar */}
            <div className="flex border-b border-stone-100">
              <div className="w-48 shrink-0 px-4 py-2 bg-stone-50 border-r border-stone-100" />
              {([1, 2, 3, 4] as PhaseYear[]).map((yr) => {
                const colors = YEAR_COLORS[yr];
                return (
                  <div
                    key={yr}
                    className={`flex-1 text-center text-xs font-semibold py-2 border-r border-stone-100 last:border-0 ${colors.bg}`}
                  >
                    <span className={colors.text}>Year {yr}</span>
                    <span className="block text-[10px] font-normal text-stone-400">
                      {YEAR_SUBTITLES[yr]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Month grid header */}
            <div className="flex border-b border-stone-100">
              <div className="w-48 shrink-0 px-4 py-1.5 bg-stone-50 border-r border-stone-100 text-xs text-stone-400">
                Phase
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: TOTAL_MONTHS }, (_, i) => i + 1).map((m) => {
                  const isGateMonth = gates.some((g) => g.month === m);
                  const isQuarter = m % 3 === 0;
                  const yr = monthToYear(m);
                  return (
                    <div
                      key={m}
                      className={`flex-1 text-center text-[9px] py-1 border-r border-stone-50 cursor-pointer transition-colors ${
                        hoveredMonth === m ? YEAR_COLORS[yr].bg : ''
                      } ${isGateMonth ? 'bg-red-50' : ''}`}
                      onMouseEnter={() => setHoveredMonth(m)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      <span className={isQuarter ? 'font-semibold text-stone-500' : 'text-stone-300'}>
                        {m}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase bars — colored by year */}
            {phases.map((phase) => {
              const yr = monthToYear(phase.startMonth);
              const colors = YEAR_COLORS[yr];
              const startPct = ((phase.startMonth - 1) / TOTAL_MONTHS) * 100;
              const widthPct = (phase.durationMonths / TOTAL_MONTHS) * 100;

              return (
                <div key={phase.id} className="flex border-b border-stone-50 group">
                  <div className="w-48 shrink-0 px-4 py-2 border-r border-stone-100 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${colors.bar}`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-stone-700 truncate">{phase.name}</p>
                      <p className="text-[10px] text-stone-400">
                        {phase.isContractor ? 'Contractor' : phase.isDiy ? 'DIY' : '—'}
                        {phase.costEur > 0 && ` · €${fmt(phase.costEur)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 relative py-1.5">
                    <div
                      className={`absolute top-1 bottom-1 rounded ${colors.bar} opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-1.5 overflow-hidden`}
                      style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                    >
                      {widthPct > 8 && (
                        <span className="text-[9px] font-medium text-white truncate">
                          M{phase.startMonth}–{phase.startMonth + phase.durationMonths - 1}
                        </span>
                      )}
                    </div>

                    {/* Decision gate markers */}
                    {gates.map((gate) => {
                      const gatePct = ((gate.month - 0.5) / TOTAL_MONTHS) * 100;
                      return (
                        <div
                          key={gate.month}
                          className="absolute top-0 bottom-0 w-px bg-red-400 opacity-30"
                          style={{ left: `${gatePct}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Decision gates row */}
            <div className="flex border-b border-stone-200">
              <div className="w-48 shrink-0 px-4 py-2 bg-stone-50 border-r border-stone-100 text-xs text-stone-500 font-medium">
                Decision Gates
              </div>
              <div className="flex-1 relative py-2">
                {gates.map((gate) => {
                  const pct = ((gate.month - 0.5) / TOTAL_MONTHS) * 100;
                  return (
                    <div
                      key={gate.month}
                      className="absolute top-0 bottom-0 flex flex-col items-center"
                      style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="w-px h-full bg-red-400" />
                      <div className="absolute top-1 bg-red-100 border border-red-300 rounded px-1.5 py-0.5 whitespace-nowrap">
                        <span className="text-[9px] font-semibold text-red-700">
                          {gate.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cash flow chart */}
            {showCashFlow && (
              <>
                {/* Funding inflows row */}
                <div className="flex border-b border-stone-100">
                  <div className="w-48 shrink-0 px-4 py-2 bg-stone-50 border-r border-stone-100 text-xs text-stone-500">
                    Funding Inflows
                  </div>
                  <div className="flex-1 relative py-1.5">
                    {inflows.map((inflow, idx) => {
                      const startPct = ((inflow.startMonth - 1) / TOTAL_MONTHS) * 100;
                      const widthPct =
                        ((inflow.endMonth - inflow.startMonth + 1) / TOTAL_MONTHS) * 100;
                      return (
                        <div
                          key={idx}
                          className="absolute top-1 bottom-1 rounded bg-emerald-200 opacity-70 flex items-center px-1.5 overflow-hidden"
                          style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                        >
                          <span className="text-[9px] text-emerald-800 truncate">
                            {inflow.label} (€{fmt(inflow.monthlyAmount)}/mo)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cash remaining chart */}
                <div className="flex border-b border-stone-100">
                  <div className="w-48 shrink-0 px-4 py-2 bg-stone-50 border-r border-stone-100">
                    <p className="text-xs text-stone-500">Cash Remaining</p>
                    <p className="text-sm font-bold text-stone-900 tabular-nums">
                      €{fmt(snapshots[snapshots.length - 1]?.cashRemaining ?? 0)}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">at month 48</p>
                  </div>
                  <div className="flex-1 flex items-end h-24 px-px">
                    {snapshots.map((snap) => {
                      const normalizedHeight =
                        ((snap.cashRemaining - minCash) / cashRange) * 100;
                      const isNegative = snap.cashRemaining < 0;
                      const yr = monthToYear(snap.month);
                      return (
                        <div
                          key={snap.month}
                          className="flex-1 flex flex-col justify-end cursor-pointer group/bar relative"
                          onMouseEnter={() => setHoveredMonth(snap.month)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        >
                          <div
                            className={`w-full transition-all ${
                              isNegative ? 'bg-red-400' : 'bg-emerald-400'
                            } ${hoveredMonth === snap.month ? 'opacity-100' : 'opacity-60'} rounded-t-sm`}
                            style={{ height: `${Math.max(1, normalizedHeight)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cumulative spend chart — bars colored by year */}
                <div className="flex">
                  <div className="w-48 shrink-0 px-4 py-2 bg-stone-50 border-r border-stone-100">
                    <p className="text-xs text-stone-500">Cumulative Spend</p>
                    <p className="text-sm font-bold text-stone-900 tabular-nums">
                      €{fmt(snapshots[snapshots.length - 1]?.cumulativeSpend ?? 0)}
                    </p>
                  </div>
                  <div className="flex-1 flex items-end h-16 px-px">
                    {snapshots.map((snap) => {
                      const maxSpend = snapshots[snapshots.length - 1]?.cumulativeSpend || 1;
                      const pct = (snap.cumulativeSpend / maxSpend) * 100;
                      const yr = monthToYear(snap.month);
                      return (
                        <div
                          key={snap.month}
                          className="flex-1 flex flex-col justify-end cursor-pointer"
                          onMouseEnter={() => setHoveredMonth(snap.month)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        >
                          <div
                            className={`w-full ${YEAR_COLORS[yr].bar} rounded-t-sm ${
                              hoveredMonth === snap.month ? 'opacity-100' : 'opacity-50'
                            }`}
                            style={{ height: `${Math.max(1, pct)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredSnap && (
        <div className="rounded-lg border border-stone-200 bg-white shadow-sm px-4 py-3">
          <p className="text-xs font-semibold text-stone-700 mb-2">
            Month {hoveredSnap.month} — {YEAR_LABELS[monthToYear(hoveredSnap.month) as PhaseYear]}
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-stone-400">Phase spend</p>
              <p className="font-medium text-stone-800 tabular-nums">€{fmt(hoveredSnap.phaseSpend)}</p>
            </div>
            <div>
              <p className="text-stone-400">Carrying costs</p>
              <p className="font-medium text-stone-800 tabular-nums">€{fmt(hoveredSnap.carryingCosts)}</p>
            </div>
            <div>
              <p className="text-stone-400">Living costs</p>
              <p className="font-medium text-stone-800 tabular-nums">€{fmt(hoveredSnap.livingCosts)}</p>
            </div>
            <div>
              <p className="text-stone-400">Funding inflow</p>
              <p className="font-medium text-emerald-700 tabular-nums">+€{fmt(hoveredSnap.fundingInflow)}</p>
            </div>
            <div>
              <p className="text-stone-400">Net</p>
              <p className={`font-medium tabular-nums ${hoveredSnap.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {hoveredSnap.net >= 0 ? '+' : ''}€{fmt(hoveredSnap.net)}
              </p>
            </div>
            <div>
              <p className="text-stone-400">Cash remaining</p>
              <p className={`font-bold tabular-nums ${hoveredSnap.isLiquidityWarning ? 'text-red-600' : 'text-stone-900'}`}>
                €{fmt(hoveredSnap.cashRemaining)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase legend — year-based */}
      <div className="flex flex-wrap gap-3 text-xs text-stone-500">
        {([1, 2, 3, 4] as PhaseYear[]).map((yr) => (
          <span key={yr} className="flex items-center gap-1">
            <span className={`w-3 h-2 rounded ${YEAR_COLORS[yr].bar}`} />
            Y{yr} {YEAR_SUBTITLES[yr]}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-1 h-3 bg-red-400" /> Decision gate
        </span>
      </div>
    </div>
  );
}
