'use client';

import { useState } from 'react';
import Link from 'next/link';
import DivergenceReport from './DivergenceReport';
import type { RenovationScenario, RenovationPhase, LineItem, FarmFeature, OutbuildingConversion } from '@/types/renovation';

const TAX_BONUS_LABEL: Record<string, string> = {
  ristrutturazione: 'Ristr. 50%',
  ecobonus: 'Ecobonus 65%',
  sismabonus: 'Sismabonus',
  mobili: 'Bonus Mobili',
  none: '',
};

const FARM_FEATURE_LABEL: Record<string, string> = {
  chickens: 'Chickens',
  goats: 'Goats',
  pizza_oven: 'Pizza Oven',
  courtyard: 'Courtyard',
  olive_grove: 'Olive Grove',
  vegetable_garden: 'Vegetable Garden',
  wine_cellar: 'Wine Cellar',
};

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function fmtRange(min: number, max: number) {
  return `€${fmt(min)} – €${fmt(max)}`;
}

function LineItemRow({ item }: { item: LineItem }) {
  return (
    <tr className="border-b border-stone-100 last:border-0">
      <td className="py-2 pr-4 text-sm text-stone-700 align-top">
        <span className="font-medium">{item.description}</span>
        {item.notes && <span className="block text-xs text-stone-400 mt-0.5">{item.notes}</span>}
      </td>
      <td className="py-2 pr-3 text-xs text-stone-500 align-top whitespace-nowrap">
        {item.is_regulated && (
          <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-xs mr-1">Permit</span>
        )}
        {item.tax_bonus && item.tax_bonus !== 'none' && (
          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-xs">
            {TAX_BONUS_LABEL[item.tax_bonus]}
          </span>
        )}
      </td>
      <td className="py-2 text-sm text-stone-800 align-top text-right whitespace-nowrap">
        {fmtRange(item.contractor_cost_min, item.contractor_cost_max)}
      </td>
    </tr>
  );
}

function PhaseCard({ phase }: { phase: RenovationPhase }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">
            {phase.phase_number}
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-800">{phase.name}</p>
            <p className="text-xs text-stone-400">{phase.name_it} · {phase.duration_months}mo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-700 font-medium">
            {fmtRange(phase.total_min, phase.total_max)}
          </span>
          <div className="flex gap-1">
            {phase.is_energy_work && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">Energy</span>
            )}
            {phase.enea_required && (
              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">ENEA</span>
            )}
          </div>
          <span className="text-stone-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 py-3">
          {phase.description && (
            <p className="text-xs text-stone-500 mb-3">{phase.description}</p>
          )}
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="pb-1.5 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Work Item</th>
                <th className="pb-1.5 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Tags</th>
                <th className="pb-1.5 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Cost Range</th>
              </tr>
            </thead>
            <tbody>
              {phase.line_items.map((item) => (
                <LineItemRow key={item.key} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FarmFeatureRow({ feature }: { feature: FarmFeature }) {
  if (!feature.enabled) return null;
  return (
    <div className="flex items-start justify-between py-2 border-b border-stone-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-stone-800">{FARM_FEATURE_LABEL[feature.type] ?? feature.type}</p>
        {feature.notes && <p className="text-xs text-stone-500 mt-0.5">{feature.notes}</p>}
        {feature.daily_time_minutes && (
          <p className="text-xs text-stone-400 mt-0.5">{feature.daily_time_minutes} min/day</p>
        )}
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="text-sm text-stone-700">Setup: {fmtRange(feature.setup_cost_min, feature.setup_cost_max)}</p>
        <p className="text-xs text-stone-400">Running: {fmtRange(feature.annual_operating_cost_min, feature.annual_operating_cost_max)}/yr</p>
        {feature.annual_income_offset ? (
          <p className="text-xs text-emerald-600">–€{fmt(feature.annual_income_offset)} costs offset/yr</p>
        ) : null}
      </div>
    </div>
  );
}

function OutbuildingRow({ ob }: { ob: OutbuildingConversion }) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-stone-800">{ob.name}</p>
          <p className="text-xs text-stone-500 mt-0.5">{ob.description}</p>
          <p className="text-xs text-stone-400 mt-1">{ob.sqm} m² · +{ob.additional_beds} beds · Year {ob.start_year}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-stone-700">{fmtRange(ob.budget_min, ob.budget_max)}</p>
          {ob.additional_annual_income > 0 && (
            <p className="text-xs text-emerald-600 mt-0.5">+€{fmt(ob.additional_annual_income)}/yr income</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, propertyId, locale }: { scenario: RenovationScenario; propertyId: string; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const midpoint = (scenario.renovation_total_min + scenario.renovation_total_max) / 2;
  const totalWithContingency = midpoint * (1 + scenario.contingency_pct);
  const isLifestyle = scenario.type === 'lifestyle';
  const enabledFarmFeatures = scenario.farm_features.filter((f) => f.enabled);

  return (
    <div className={`rounded-xl border overflow-hidden ${isLifestyle ? 'border-amber-200' : 'border-stone-200'}`}>
      {/* Header */}
      <div className={`px-5 py-4 ${isLifestyle ? 'bg-amber-50' : 'bg-stone-50'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${isLifestyle ? 'bg-amber-200 text-amber-800' : 'bg-stone-200 text-stone-600'}`}>
                {scenario.type === 'basic' ? 'Basic' : 'Lifestyle'}
              </span>
              {scenario.guest_separation_included && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">Guest sep.</span>
              )}
              <Link
                href={`/${locale}/property/${propertyId}/scenarios/${scenario.id}`}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
              >
                Configure scope, DIY & timeline →
              </Link>
            </div>
            <h3 className="font-bold text-stone-900 text-base">{scenario.name}</h3>
            <p className="text-xs text-stone-500 mt-0.5 italic">{scenario.name_it}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-stone-400 mb-0.5">Base cost</p>
            <p className="text-base font-bold text-stone-900">
              {fmtRange(scenario.renovation_total_min, scenario.renovation_total_max)}
            </p>
          </div>
        </div>

        {/* Cost summary row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-stone-400">Duration</p>
            <p className="text-sm font-semibold text-stone-800">{scenario.renovation_duration_months}mo</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-400">Contingency (20%)</p>
            <p className="text-sm font-semibold text-amber-700">+€{fmt(scenario.contingency_amount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-400">Total incl. contingency</p>
            <p className="text-sm font-bold text-stone-900">~€{fmt(Math.round(totalWithContingency))}</p>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-2.5 text-xs font-medium text-stone-500 hover:text-stone-700 border-t border-stone-100 flex items-center justify-center gap-1.5 hover:bg-stone-50 transition-colors"
      >
        {expanded ? '▲ Hide phases' : `▼ Show ${scenario.phases.length} phases`}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          {/* Phases */}
          {scenario.phases.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mt-2">Renovation Phases</p>
              {scenario.phases.map((phase) => (
                <PhaseCard key={phase.phase_number} phase={phase} />
              ))}
            </div>
          )}

          {/* Farm features */}
          {enabledFarmFeatures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Farmstead Features</p>
              <div className="rounded-lg border border-stone-200 px-4 divide-y divide-stone-100">
                {enabledFarmFeatures.map((f) => (
                  <FarmFeatureRow key={f.type} feature={f} />
                ))}
              </div>
            </div>
          )}

          {/* Outbuilding conversions */}
          {scenario.outbuilding_conversions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Outbuilding Conversions</p>
              <div className="space-y-2">
                {scenario.outbuilding_conversions.map((ob, i) => (
                  <OutbuildingRow key={i} ob={ob} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  propertyId: string;
  locale: string;
  initialScenarios: RenovationScenario[];
  hasAnalysis: boolean;
}

export default function ScenariosPanel({ propertyId, locale, initialScenarios, hasAnalysis }: Props) {
  const [scenarios, setScenarios] = useState<RenovationScenario[]>(initialScenarios);
  const [generating, setGenerating] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [divergenceReport, setDivergenceReport] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allItemComparisons, setAllItemComparisons] = useState<any[]>([]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Generation failed');
      } else {
        setScenarios(json.scenarios);
        setDivergenceReport(null);
        setAllItemComparisons([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleMultiAgentEstimate() {
    setEstimating(true);
    setError(null);
    try {
      const results = await Promise.all(
        (['basic', 'lifestyle'] as const).map(async (scenarioType) => {
          const res = await fetch('/api/ai/estimate-renovation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId, scenarioType }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? `${scenarioType} estimation failed`);
          return json;
        }),
      );

      const newScenarios = results.map((r) => r.scenario as RenovationScenario);
      setScenarios(newScenarios);

      const combinedReport = results[results.length - 1]?.divergenceReport;
      setDivergenceReport(combinedReport ?? null);

      const combinedComparisons = results.flatMap((r) => r.allItemComparisons ?? []);
      setAllItemComparisons(combinedComparisons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setEstimating(false);
    }
  }

  const busy = generating || estimating;
  const basic = scenarios.find((s) => s.type === 'basic');
  const lifestyle = scenarios.find((s) => s.type === 'lifestyle');

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Renovation Scenarios</h2>
          <p className="text-sm text-stone-500 mt-1">
            AI-generated cost estimates for Basic (habitable) and Lifestyle (full farmstead) builds.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generating
              ? 'Generating…'
              : scenarios.length > 0
              ? 'Re-generate'
              : 'Generate Scenarios'}
          </button>
          <button
            onClick={handleMultiAgentEstimate}
            disabled={busy}
            className="px-4 py-2 bg-stone-800 text-white text-sm font-semibold rounded-lg hover:bg-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Run Claude + GPT-4o + Gemini in parallel for consensus estimates with confidence scoring"
          >
            {estimating ? 'Estimating…' : 'Multi-Agent Estimate'}
          </button>
        </div>
      </div>

      {/* No-analysis warning */}
      {!hasAnalysis && scenarios.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <span className="text-amber-600 shrink-0 mt-0.5">ℹ</span>
          <p className="text-sm text-amber-800">
            Run AI analysis first for more accurate scenario estimates — the structural assessment informs renovation complexity and costs.
          </p>
        </div>
      )}

      {/* Loading state */}
      {generating && (
        <div className="rounded-xl border border-stone-200 p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-stone-600">Claude is building your renovation scenarios…</p>
          <p className="text-xs text-stone-400 mt-1">This takes 60–120 seconds</p>
        </div>
      )}

      {estimating && (
        <div className="rounded-xl border border-stone-800 bg-stone-50 p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-stone-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-stone-700 font-medium">Multi-agent estimation in progress…</p>
          <p className="text-xs text-stone-500 mt-1">Claude, GPT-4o, and Gemini are estimating in parallel — this takes 90–180 seconds</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">Claude</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">GPT-4o</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Gemini</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-sm font-semibold text-red-800">Generation failed</p>
          <p className="text-xs text-red-700 mt-0.5">{error}</p>
        </div>
      )}

      {/* Divergence Report */}
      {divergenceReport && !busy && (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
            <h3 className="text-sm font-semibold text-stone-700">Divergence Report</h3>
          </div>
          <div className="px-5 py-4">
            <DivergenceReport report={divergenceReport} allItemComparisons={allItemComparisons} />
          </div>
        </div>
      )}

      {/* Scenarios */}
      {!busy && scenarios.length > 0 && (
        <div className="space-y-5">
          {basic && <ScenarioCard scenario={basic} propertyId={propertyId} locale={locale} />}
          {lifestyle && <ScenarioCard scenario={lifestyle} propertyId={propertyId} locale={locale} />}
        </div>
      )}

      {/* Empty state */}
      {!busy && scenarios.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center">
          <p className="text-sm font-medium text-stone-500 mb-1">No scenarios yet</p>
          <p className="text-xs text-stone-400">
            Click "Generate Scenarios" for single-agent estimates, or "Multi-Agent Estimate" for consensus across Claude, GPT-4o, and Gemini.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      {scenarios.length > 0 && !busy && (
        <p className="text-xs text-stone-400 border-t border-stone-100 pt-4">
          All costs are AI estimates based on rural Italian contractor rates. A 20% contingency is included in the total. Obtain local quotes before committing.
          {divergenceReport && ' Multi-agent estimates show consensus values — expand flagged items to see where agents disagreed.'}
        </p>
      )}
    </section>
  );
}
