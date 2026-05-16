'use client';

import { useState } from 'react';
import type {
  AIAnalysisRow,
  RegulatoryAssessmentRow,
  RegulatoryRisk,
} from '@/app/actions/ai';

interface Props {
  propertyId: string;
  initialAnalysis: AIAnalysisRow | null;
  initialRegulatory: RegulatoryAssessmentRow | null;
}

type Status = 'idle' | 'analyzing' | 'done' | 'error';

export default function AIAnalysisPanel({
  propertyId,
  initialAnalysis,
  initialRegulatory,
}: Props) {
  const [status, setStatus] = useState<Status>(
    initialAnalysis ? 'done' : 'idle',
  );
  const [analysis, setAnalysis] = useState<AIAnalysisRow | null>(initialAnalysis);
  const [regulatory, setRegulatory] = useState<RegulatoryAssessmentRow | null>(initialRegulatory);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function runAnalysis() {
    setStatus('analyzing');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Analysis failed');
        setStatus('error');
        return;
      }

      setAnalysis(data.analysis);
      setRegulatory(data.regulatory);
      setStatus('done');
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus('error');
    }
  }

  const hasRedFlag = regulatory?.overall_risk === 'red';

  return (
    <section className="space-y-6">
      {/* Header + trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-stone-900">AI Analysis</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Structural assessment + regulatory risk — powered by Claude
          </p>
        </div>
        <div className="flex items-center gap-3">
          {analysis && (
            <span className="text-xs text-stone-400">
              {new Date(analysis.created_at).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={runAnalysis}
            disabled={status === 'analyzing'}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'analyzing'
              ? '⟳ Analyzing…'
              : analysis
              ? 'Re-analyze'
              : 'Analyze with AI'}
          </button>
        </div>
      </div>

      {/* Analyzing state */}
      {status === 'analyzing' && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-8 text-center">
          <div className="text-2xl mb-3 animate-pulse">🏡</div>
          <p className="text-sm font-medium text-amber-800">
            Claude is analyzing this property…
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Structural assessment · Regulatory risk · Agriturismo path · Key risks
          </p>
          <p className="text-xs text-stone-400 mt-3">This takes 60–120 seconds.</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Analysis failed:</strong> {errorMsg}
        </div>
      )}

      {/* Idle state — no analysis yet */}
      {status === 'idle' && (
        <div className="rounded-xl border-2 border-dashed border-stone-200 p-8 text-center">
          <p className="text-stone-400 text-sm mb-1">No analysis yet</p>
          <p className="text-xs text-stone-300">
            Click &quot;Analyze with AI&quot; to generate structural assessment, regulatory risk,
            and renovation complexity — takes 60–120 seconds.
          </p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && analysis && regulatory && (
        <div className="space-y-6">
          {/* Constitution N3 red flag warning */}
          {hasRedFlag && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-red-600 text-lg mt-0.5 shrink-0">🔴</span>
              <div>
                <p className="text-sm font-semibold text-red-800">Red Regulatory Flag</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Per N3: this property cannot receive a &quot;Strong Candidate&quot; rating while a red
                  regulatory risk remains unresolved. Investigate before proceeding.
                </p>
              </div>
            </div>
          )}

          {/* Structural assessment */}
          <AnalysisCard title="Structural Assessment" badge={<AIEstimateBadge />}>
            {/* Condition score */}
            <div className="flex items-center gap-4 mb-5">
              <ConditionGauge score={analysis.structural_condition_score} />
              <div>
                <div className="text-2xl font-bold text-stone-900">
                  {analysis.structural_condition_score.toFixed(1)}
                  <span className="text-sm font-normal text-stone-400">/10</span>
                </div>
                <div className="text-xs text-stone-500">
                  {conditionLabel(analysis.structural_condition_score)}
                </div>
                <div
                  className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${complexityColor(analysis.renovation_complexity)}`}
                >
                  {complexityLabel(analysis.renovation_complexity)} renovation
                </div>
              </div>
            </div>

            <InfoBlock label="Structure" text={analysis.structural_notes} />
            <InfoBlock label="Roof" text={analysis.roof_condition} />
            <InfoBlock label="Systems" text={analysis.systems_condition} />

            {/* Guest separation (N10) */}
            <div
              className={`mt-4 p-3 rounded-lg border ${
                analysis.guest_separation_feasible
                  ? 'bg-green-50 border-green-100'
                  : 'bg-red-50 border-red-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{analysis.guest_separation_feasible ? '✅' : '⚠️'}</span>
                <span className="text-sm font-semibold text-stone-800">
                  Guest Separation (N10)
                </span>
                {!analysis.guest_separation_feasible && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                    Blocking
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-700 ml-6">
                {analysis.guest_separation_notes}
              </p>
              {(analysis.guest_separation_cost_min > 0 || analysis.guest_separation_cost_max > 0) && (
                <p className="text-xs text-stone-500 ml-6 mt-1">
                  Additional cost:{' '}
                  <strong>
                    €{analysis.guest_separation_cost_min.toLocaleString()}–
                    €{analysis.guest_separation_cost_max.toLocaleString()}
                  </strong>
                </p>
              )}
            </div>

            {/* Voltage concerns */}
            {analysis.voltage_concerns.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 mb-1">⚡ Electrical / Voltage</p>
                <ul className="space-y-1">
                  {analysis.voltage_concerns.map((c, i) => (
                    <li key={i} className="text-xs text-amber-700">• {c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key risks */}
            {analysis.key_risks.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Key Risks
                </p>
                <ul className="space-y-1.5">
                  {analysis.key_risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                      <span className="text-red-400 shrink-0 mt-0.5">▸</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key opportunities */}
            {analysis.key_opportunities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Key Opportunities
                </p>
                <ul className="space-y-1.5">
                  {analysis.key_opportunities.map((opp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                      <span className="text-green-500 shrink-0 mt-0.5">▸</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AnalysisCard>

          {/* Regulatory risk matrix */}
          <AnalysisCard
            title="Regulatory Risk"
            badge={
              <RiskBadge
                risk={regulatory.overall_risk}
                label={`Overall: ${riskLabel(regulatory.overall_risk)}`}
              />
            }
          >
            <div className="space-y-0 divide-y divide-stone-100">
              <RegulatoryRow
                label="Short-Term Rental (STR)"
                risk={regulatory.str_zoning}
                notes={regulatory.str_zoning_notes}
              />
              <RegulatoryRow
                label="Change of Use"
                risk={regulatory.change_of_use}
                notes={regulatory.change_of_use_notes}
              />
              <RegulatoryRow
                label="Building Permits / Abusi"
                risk={regulatory.building_permits}
                notes={regulatory.building_permits_notes}
              />
              <RegulatoryRow
                label="Landscape Protection"
                risk={regulatory.landscape_protection}
                notes={regulatory.landscape_protection_notes}
              />
              <RegulatoryRow
                label={`Seismic Zone ${regulatory.seismic_zone}`}
                risk={regulatory.seismic_risk}
                notes={`Zone ${regulatory.seismic_zone} — affects structural scope and cost.`}
              />
              <RegulatoryRow
                label="Animals / Livestock"
                risk={regulatory.animals_permitted}
                notes={regulatory.animals_notes}
              />
              <RegulatoryRow
                label="Septic / Water"
                risk={regulatory.septic_water}
                notes={regulatory.septic_water_notes}
              />
              <RegulatoryRow
                label="Fire Safety (CPI)"
                risk={regulatory.fire_safety}
                notes={regulatory.fire_safety_notes}
              />
              <RegulatoryRow
                label="Business Classification"
                risk={regulatory.business_classification}
                notes={regulatory.business_classification_notes}
              />
              <RegulatoryRow
                label="Tax Regime"
                risk={regulatory.tax_regime_risk}
                notes={regulatory.tax_regime_notes}
              />
            </div>

            {/* Agriturismo path */}
            <div className="mt-5 p-4 bg-stone-50 rounded-lg border border-stone-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-stone-800">
                  {regulatory.agriturismo_eligible ? '🌾 Agriturismo path' : '🏠 Locazione Turistica path'}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    regulatory.agriturismo_eligible
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {regulatory.agriturismo_eligible ? 'Eligible' : 'Not eligible'}
                </span>
              </div>
              <p className="text-sm text-stone-600">{regulatory.agriturismo_path_notes}</p>
            </div>

            {/* Wild boar warning */}
            {regulatory.wild_boar_risk && (
              <div className="mt-4 flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="text-lg shrink-0">🐗</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Wild Boar Risk</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This region has significant boar presence. Budget for boar-proof fencing
                    {regulatory.boar_fencing_cost_estimate
                      ? ` — estimated €${regulatory.boar_fencing_cost_estimate.toLocaleString()} for this land size (€3,500/ha).`
                      : ' (€3,500/ha).'}
                  </p>
                </div>
              </div>
            )}

            {/* Land threshold alerts */}
            {regulatory.land_threshold_alerts?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  Land Size Alerts
                </p>
                {regulatory.land_threshold_alerts.map((alert, i) => (
                  <div
                    key={i}
                    className="p-3 bg-blue-50 border border-blue-100 rounded-lg"
                  >
                    <p className="text-xs font-semibold text-blue-800">{alert.alert}</p>
                    <p className="text-xs text-blue-700 mt-0.5">{alert.implication}</p>
                  </div>
                ))}
              </div>
            )}
          </AnalysisCard>
        </div>
      )}
    </section>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function AnalysisCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <h3 className="font-semibold text-stone-900">{title}</h3>
        {badge}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className="text-sm text-stone-700 leading-relaxed">{text}</dd>
    </div>
  );
}

function RegulatoryRow({
  label,
  risk,
  notes,
}: {
  label: string;
  risk: RegulatoryRisk;
  notes: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-3">
      <button
        className="w-full flex items-center gap-3 text-left group"
        onClick={() => setOpen((o) => !o)}
      >
        <RiskDot risk={risk} />
        <span className="text-sm font-medium text-stone-800 flex-1 group-hover:text-stone-900">
          {label}
        </span>
        <span className="text-stone-300 text-xs group-hover:text-stone-400">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <p className="mt-2 ml-7 text-sm text-stone-600 leading-relaxed">{notes}</p>
      )}
    </div>
  );
}

function RiskDot({ risk }: { risk: RegulatoryRisk }) {
  const cls =
    risk === 'red'
      ? 'bg-red-500'
      : risk === 'yellow'
      ? 'bg-amber-400'
      : 'bg-green-500';
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cls}`} />;
}

function RiskBadge({ risk, label }: { risk: RegulatoryRisk; label: string }) {
  const cls =
    risk === 'red'
      ? 'bg-red-50 text-red-700 border-red-200'
      : risk === 'yellow'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-green-50 text-green-700 border-green-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${cls}`}>
      <RiskDot risk={risk} />
      {label}
    </span>
  );
}

function ConditionGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 7.5 ? '#22c55e' : score >= 5 ? '#f59e0b' : score >= 3 ? '#f97316' : '#ef4444';

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${pct} ${100 - pct}`}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function AIEstimateBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-500 text-xs font-medium">
      AI Estimate
    </span>
  );
}

function conditionLabel(score: number): string {
  if (score >= 8.5) return 'Excellent condition';
  if (score >= 7) return 'Good condition';
  if (score >= 5.5) return 'Moderate — work needed';
  if (score >= 4) return 'Poor — major renovation';
  if (score >= 2.5) return 'Ruin / shell only';
  return 'Total ruin';
}

function complexityLabel(c: string): string {
  const m: Record<string, string> = {
    low: 'Low complexity',
    medium: 'Medium complexity',
    high: 'High complexity',
    very_high: 'Very high complexity',
  };
  return m[c] ?? c;
}

function complexityColor(c: string): string {
  const m: Record<string, string> = {
    low: 'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-orange-50 text-orange-700',
    very_high: 'bg-red-50 text-red-700',
  };
  return m[c] ?? 'bg-stone-100 text-stone-600';
}

function riskLabel(r: RegulatoryRisk): string {
  return r === 'red' ? 'Blocking' : r === 'yellow' ? 'Investigate' : 'Clear';
}
