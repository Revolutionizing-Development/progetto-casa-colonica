'use client';

import { useMemo } from 'react';
import type { Invoice } from '@/types/invoice';
import type { RenovationScenario, RenovationPhase, LineItem } from '@/types/renovation';

function fmt(n: number) { return n.toLocaleString('en-US'); }
function fmtEur(n: number) { return `€${fmt(n)}`; }

interface LineItemBudgetRow {
  key: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  actual: number;
  diyMaterials: number;
  contractorSavings: number;
  variance: number;
  variancePct: number;
  invoiceCount: number;
}

interface PhaseSummary {
  phaseNumber: number;
  name: string;
  budgetMin: number;
  budgetMax: number;
  actual: number;
  diyMaterials: number;
  items: LineItemBudgetRow[];
  unmatchedInvoices: Invoice[];
}

function VarianceBadge({ variance, pct }: { variance: number; pct: number }) {
  if (variance === 0) return <span className="text-xs text-stone-400">—</span>;
  const isUnder = variance < 0;
  return (
    <span className={`text-xs font-medium ${isUnder ? 'text-emerald-700' : 'text-red-600'}`}>
      {isUnder ? '' : '+'}{fmtEur(variance)} ({isUnder ? '' : '+'}{pct.toFixed(0)}%)
    </span>
  );
}

interface Props {
  scenarios: RenovationScenario[];
  invoices: Invoice[];
  selectedScenarioId?: string;
}

export default function BudgetActualPanel({ scenarios, invoices, selectedScenarioId }: Props) {
  const scenario = scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[0];

  const { phases, totalBudgetMin, totalBudgetMax, totalActual, totalDIY, unmatchedGlobal } = useMemo(() => {
    if (!scenario) return { phases: [], totalBudgetMin: 0, totalBudgetMax: 0, totalActual: 0, totalDIY: 0, unmatchedGlobal: invoices };

    const matchedIds = new Set<string>();
    const phaseResults: PhaseSummary[] = [];

    for (const phase of scenario.phases) {
      const items: LineItemBudgetRow[] = [];
      const phaseInvoices = invoices.filter((inv) => inv.phase_number === phase.phase_number);
      const phaseUnmatched: Invoice[] = [];

      for (const li of phase.line_items) {
        const matched = phaseInvoices.filter((inv) => inv.line_item_key === li.key);
        matched.forEach((inv) => matchedIds.add(inv.id));

        const actual = matched.reduce((s, inv) => s + inv.total_amount, 0);
        const diyMaterials = matched.filter((inv) => inv.is_diy_materials).reduce((s, inv) => s + inv.total_amount, 0);
        const budgetMid = Math.round((li.contractor_cost_min + li.contractor_cost_max) / 2);
        const contractorSavings = diyMaterials > 0 ? Math.max(0, budgetMid - actual) : 0;
        const variance = actual - budgetMid;
        const variancePct = budgetMid > 0 ? (variance / budgetMid) * 100 : 0;

        items.push({
          key: li.key,
          description: li.description,
          budgetMin: li.contractor_cost_min,
          budgetMax: li.contractor_cost_max,
          actual,
          diyMaterials,
          contractorSavings,
          variance,
          variancePct,
          invoiceCount: matched.length,
        });
      }

      const unmatchedPhaseInvoices = phaseInvoices.filter((inv) => !matchedIds.has(inv.id));
      unmatchedPhaseInvoices.forEach((inv) => matchedIds.add(inv.id));

      phaseResults.push({
        phaseNumber: phase.phase_number,
        name: phase.name,
        budgetMin: phase.total_min,
        budgetMax: phase.total_max,
        actual: items.reduce((s, i) => s + i.actual, 0) + unmatchedPhaseInvoices.reduce((s, inv) => s + inv.total_amount, 0),
        diyMaterials: items.reduce((s, i) => s + i.diyMaterials, 0),
        items,
        unmatchedInvoices: unmatchedPhaseInvoices,
      });
    }

    const unmatchedGlobal = invoices.filter((inv) => !matchedIds.has(inv.id));

    return {
      phases: phaseResults,
      totalBudgetMin: scenario.renovation_total_min,
      totalBudgetMax: scenario.renovation_total_max,
      totalActual: phaseResults.reduce((s, p) => s + p.actual, 0) + unmatchedGlobal.reduce((s, inv) => s + inv.total_amount, 0),
      totalDIY: phaseResults.reduce((s, p) => s + p.diyMaterials, 0),
      unmatchedGlobal,
    };
  }, [scenario, invoices]);

  if (!scenario) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-10 text-center">
        <p className="text-stone-400 text-sm">Generate renovation scenarios first to see budget vs actual comparison.</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-10 text-center">
        <p className="text-stone-400 text-sm">No invoices recorded yet. Record invoices to track budget vs actual spending.</p>
      </div>
    );
  }

  const budgetMid = Math.round((totalBudgetMin + totalBudgetMax) / 2);
  const totalVariance = totalActual - budgetMid;
  const overallPct = budgetMid > 0 ? (totalActual / budgetMid) * 100 : 0;
  const contingency = scenario.contingency_amount;
  const effectiveBudget = budgetMid + contingency;
  const headroom = effectiveBudget - totalActual;

  return (
    <section className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Budget (mid)"
          value={fmtEur(budgetMid)}
          sub={`${fmtEur(totalBudgetMin)} – ${fmtEur(totalBudgetMax)}`}
        />
        <SummaryCard
          label="Actual spent"
          value={fmtEur(totalActual)}
          sub={`${overallPct.toFixed(0)}% of budget`}
          highlight={totalActual > effectiveBudget ? 'red' : totalActual > budgetMid ? 'amber' : 'green'}
        />
        <SummaryCard
          label="Contingency headroom"
          value={fmtEur(headroom)}
          sub={`Contingency: ${fmtEur(contingency)} (${scenario.contingency_pct}%)`}
          highlight={headroom < 0 ? 'red' : headroom < contingency * 0.3 ? 'amber' : 'green'}
        />
        <SummaryCard
          label="DIY savings"
          value={fmtEur(totalDIY > 0 ? Math.max(0, budgetMid - totalActual) : 0)}
          sub={`DIY materials: ${fmtEur(totalDIY)}`}
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-stone-500">
          <span>Spent: {fmtEur(totalActual)}</span>
          <span>Budget + contingency: {fmtEur(effectiveBudget)}</span>
        </div>
        <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-stone-300 rounded-full"
            style={{ width: `${Math.min(100, (budgetMid / effectiveBudget) * 100)}%` }}
          />
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${
              totalActual > effectiveBudget ? 'bg-red-500' : totalActual > budgetMid ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, (totalActual / effectiveBudget) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-400">
          <span>{overallPct.toFixed(0)}% spent</span>
          {totalVariance !== 0 && (
            <span className={totalVariance > 0 ? 'text-red-500' : 'text-emerald-600'}>
              {totalVariance > 0 ? 'Over' : 'Under'} budget by {fmtEur(Math.abs(totalVariance))}
            </span>
          )}
        </div>
      </div>

      {/* Phase breakdown */}
      {phases.map((phase) => (
        <PhaseBlock key={phase.phaseNumber} phase={phase} />
      ))}

      {/* Unmatched invoices */}
      {unmatchedGlobal.length > 0 && (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3 bg-stone-50 border-b border-stone-200">
            <h3 className="text-sm font-semibold text-stone-700">
              Unassigned invoices
              <span className="ml-2 text-xs font-normal text-stone-400">
                ({unmatchedGlobal.length} invoices not matched to any phase)
              </span>
            </h3>
          </div>
          <div className="divide-y divide-stone-100">
            {unmatchedGlobal.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-2.5">
                <div>
                  <span className="text-sm text-stone-700">{inv.vendor_name}</span>
                  <span className="text-xs text-stone-400 ml-2">{inv.description}</span>
                </div>
                <span className="text-sm font-medium text-stone-900">{fmtEur(inv.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  label, value, sub, highlight,
}: {
  label: string; value: string; sub?: string; highlight?: 'green' | 'amber' | 'red';
}) {
  const bgColor = highlight === 'red' ? 'bg-red-50 border-red-200'
    : highlight === 'amber' ? 'bg-amber-50 border-amber-200'
    : highlight === 'green' ? 'bg-emerald-50 border-emerald-200'
    : 'bg-white border-stone-200';

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-stone-900">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function PhaseBlock({ phase }: { phase: PhaseSummary }) {
  const phaseMid = Math.round((phase.budgetMin + phase.budgetMax) / 2);
  const phaseVariance = phase.actual - phaseMid;

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700">
          Phase {phase.phaseNumber}: {phase.name}
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-stone-400">Budget: {fmtEur(phase.budgetMin)}–{fmtEur(phase.budgetMax)}</span>
          <span className="text-stone-700 font-medium">Actual: {fmtEur(phase.actual)}</span>
          <VarianceBadge variance={phaseVariance} pct={phaseMid > 0 ? (phaseVariance / phaseMid) * 100 : 0} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-5 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Line Item</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Budget</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Actual</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">DIY Mat.</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Variance</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Inv.</th>
            </tr>
          </thead>
          <tbody>
            {phase.items.map((item) => {
              const budgetMid = Math.round((item.budgetMin + item.budgetMax) / 2);
              return (
                <tr key={item.key} className="border-b border-stone-100 last:border-0">
                  <td className="px-5 py-2.5 text-stone-700">{item.description}</td>
                  <td className="px-4 py-2.5 text-right text-stone-600">
                    {fmtEur(budgetMid)}
                    <span className="block text-xs text-stone-400">{fmtEur(item.budgetMin)}–{fmtEur(item.budgetMax)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-stone-900">
                    {item.actual > 0 ? fmtEur(item.actual) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-500">
                    {item.diyMaterials > 0 ? fmtEur(item.diyMaterials) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {item.actual > 0
                      ? <VarianceBadge variance={item.variance} pct={item.variancePct} />
                      : <span className="text-xs text-stone-400">pending</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-400">{item.invoiceCount || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {phase.unmatchedInvoices.length > 0 && (
        <div className="px-5 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
          + {phase.unmatchedInvoices.length} invoice{phase.unmatchedInvoices.length > 1 ? 's' : ''} in this phase not matched to a line item (
          {fmtEur(phase.unmatchedInvoices.reduce((s, inv) => s + inv.total_amount, 0))})
        </div>
      )}
    </div>
  );
}
