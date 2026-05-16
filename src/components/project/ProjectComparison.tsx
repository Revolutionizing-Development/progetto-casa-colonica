'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ProjectRow } from '@/app/actions/projects';
import type { HouseholdProfile } from '@/types/household';
import type { ProjectComparisonData } from '@/app/actions/comparison';
import { getProjectComparisonData } from '@/app/actions/comparison';
import { computeScenarioCosts } from '@/lib/financial/scenario-cost-calculator';
import type { ScenarioCostSummary, ScopeToggles, DIYToggles, PhaseAssignments } from '@/types/cost-config';

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

interface ComparisonMetrics {
  totalInvestment: number;
  purchasePrice: number;
  renovationCost: number;
  contingency: number;
  renovationDuration: string;
  ongoingWorkHours: string;
  annualPropertyIncome: number;
  annualOperatingCost: number;
  netFromProperty: number;
  householdIncome: number;
  cashRemaining: number;
  privacyLevel: string;
  exitValue: string;
}

function computeMetrics(
  data: ProjectComparisonData,
  hp: HouseholdProfile,
): ComparisonMetrics | null {
  if (!data.property || !data.scenario) return null;

  const scopeToggles = ((data.scenario as unknown as Record<string, unknown>).scope_toggles as ScopeToggles) ?? {};
  const diyToggles = ((data.scenario as unknown as Record<string, unknown>).diy_toggles as DIYToggles) ?? {};
  const phaseAssignments = ((data.scenario as unknown as Record<string, unknown>).phase_assignments as PhaseAssignments) ?? {};

  const summary = computeScenarioCosts({
    region: 'umbria',
    scopeToggles,
    diyToggles,
    phaseAssignments,
    quantities: {},
  });

  const purchasePrice = data.property.listed_price;
  const renovationCost = summary.totalEffective;
  const contingency = summary.contingencyAmount;
  const totalInvestment = purchasePrice + summary.grandTotal;

  const totalMonths = hp.us_phase_months + hp.diy_phase_months;
  const usSavings = hp.monthly_savings_rate * hp.us_phase_months;
  const livingCostDuringDiy = Math.round(hp.annual_living_costs / 12) * hp.diy_phase_months;
  const partnerIncomeDuringDiy = Math.round(hp.partner_income / 12) * hp.diy_phase_months;
  const carryingCosts = 1250 * totalMonths;

  const cashRemaining =
    hp.starting_cash +
    usSavings +
    partnerIncomeDuringDiy -
    totalInvestment -
    carryingCosts -
    livingCostDuringDiy;

  const isHosting = data.projectType === 'farmstead_hosting';
  const annualPropertyIncome = isHosting ? 45000 : 0;
  const annualOperatingCost = summary.totalOngoingAnnual;
  const netFromProperty = annualPropertyIncome - annualOperatingCost;
  const householdIncome = netFromProperty + hp.partner_income;

  return {
    totalInvestment,
    purchasePrice,
    renovationCost,
    contingency,
    renovationDuration: `${totalMonths} months (${hp.us_phase_months} US + ${hp.diy_phase_months} DIY)`,
    ongoingWorkHours: isHosting ? '15-25 hrs/week' : '2-5 hrs/week',
    annualPropertyIncome,
    annualOperatingCost,
    netFromProperty,
    householdIncome,
    cashRemaining,
    privacyLevel: isHosting ? 'Scheduled — guests present ~40% of year' : 'Complete — no guests',
    exitValue: isHosting ? 'Income property premium (+20-30%)' : 'Standard residential',
  };
}

function MetricRow({
  label,
  valueA,
  valueB,
  format = 'currency',
  highlight,
}: {
  label: string;
  valueA: string | number;
  valueB: string | number;
  format?: 'currency' | 'text';
  highlight?: 'higher' | 'lower';
}) {
  const fmtVal = (v: string | number) => {
    if (format === 'text' || typeof v === 'string') return v;
    const prefix = v < 0 ? '-' : '';
    return `${prefix}€${fmt(Math.abs(v))}`;
  };

  const aNum = typeof valueA === 'number' ? valueA : 0;
  const bNum = typeof valueB === 'number' ? valueB : 0;

  let aWins = false;
  let bWins = false;
  if (highlight === 'higher') {
    aWins = aNum > bNum;
    bWins = bNum > aNum;
  } else if (highlight === 'lower') {
    aWins = aNum < bNum;
    bWins = bNum < aNum;
  }

  return (
    <div className="grid grid-cols-3 border-b border-stone-100 last:border-0">
      <div className="px-4 py-3 text-sm text-stone-600">{label}</div>
      <div className={`px-4 py-3 text-sm font-medium tabular-nums text-right ${aWins ? 'text-emerald-700 bg-emerald-50' : 'text-stone-800'}`}>
        {fmtVal(valueA)}
      </div>
      <div className={`px-4 py-3 text-sm font-medium tabular-nums text-right ${bWins ? 'text-emerald-700 bg-emerald-50' : 'text-stone-800'}`}>
        {fmtVal(valueB)}
      </div>
    </div>
  );
}

interface QualitativeItem {
  label: string;
  projectA: string;
  projectB: string;
}

function QualitativeCard({ item }: { item: QualitativeItem }) {
  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100">
        <p className="text-xs font-semibold text-stone-700">{item.label}</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-stone-100">
        <div className="px-4 py-3">
          <p className="text-xs text-stone-600 leading-relaxed">{item.projectA}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-stone-600 leading-relaxed">{item.projectB}</p>
        </div>
      </div>
    </div>
  );
}

function buildQualitativeItems(
  metricsA: ComparisonMetrics | null,
  metricsB: ComparisonMetrics | null,
  hp: HouseholdProfile,
): QualitativeItem[] {
  const isAHosting = metricsA?.annualPropertyIncome && metricsA.annualPropertyIncome > 0;
  const isBHosting = metricsB?.annualPropertyIncome && metricsB.annualPropertyIncome > 0;

  const riskA = isAHosting
    ? `Property generates €${fmt(metricsA?.netFromProperty ?? 0)}/yr — household survives on property income alone`
    : `Property drains €${fmt(metricsA?.annualOperatingCost ?? 0)}/yr from savings`;
  const riskB = isBHosting
    ? `Property generates €${fmt(metricsB?.netFromProperty ?? 0)}/yr — household survives on property income alone`
    : `Property drains €${fmt(metricsB?.annualOperatingCost ?? 0)}/yr from savings`;

  return [
    {
      label: 'Privacy',
      projectA: isAHosting ? 'Scheduled — guests present ~40% of the year' : 'Complete — no guests, no shared spaces',
      projectB: isBHosting ? 'Scheduled — guests present ~40% of the year' : 'Complete — no guests, no shared spaces',
    },
    {
      label: 'Daily routine',
      projectA: isAHosting ? 'Guest turnovers + experience hosting + animal care' : 'Garden + personal time',
      projectB: isBHosting ? 'Guest turnovers + experience hosting + animal care' : 'Garden + personal time',
    },
    {
      label: 'Social life',
      projectA: isAHosting ? 'Built-in through guest interactions + wine tastings' : 'Must build independently',
      projectB: isBHosting ? 'Built-in through guest interactions + wine tastings' : 'Must build independently',
    },
    {
      label: 'Purpose after renovation',
      projectA: isAHosting ? 'Running a micro-hospitality business' : 'Need to find activities',
      projectB: isBHosting ? 'Running a micro-hospitality business' : 'Need to find activities',
    },
    {
      label: 'Risk if partner stops working',
      projectA: riskA,
      projectB: riskB,
    },
  ];
}

interface Props {
  projects: ProjectRow[];
  householdProfile: HouseholdProfile;
}

export default function ProjectComparison({ projects, householdProfile }: Props) {
  const [projectIdA, setProjectIdA] = useState(projects[0]?.id ?? '');
  const [projectIdB, setProjectIdB] = useState(projects[1]?.id ?? '');
  const [dataA, setDataA] = useState<ProjectComparisonData | null>(null);
  const [dataB, setDataB] = useState<ProjectComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectIdA || !projectIdB) return;
    setLoading(true);
    Promise.all([
      getProjectComparisonData(projectIdA),
      getProjectComparisonData(projectIdB),
    ]).then(([a, b]) => {
      setDataA(a);
      setDataB(b);
      setLoading(false);
    });
  }, [projectIdA, projectIdB]);

  const metricsA = useMemo(
    () => (dataA ? computeMetrics(dataA, householdProfile) : null),
    [dataA, householdProfile],
  );
  const metricsB = useMemo(
    () => (dataB ? computeMetrics(dataB, householdProfile) : null),
    [dataB, householdProfile],
  );

  const qualitativeItems = useMemo(
    () => buildQualitativeItems(metricsA, metricsB, householdProfile),
    [metricsA, metricsB, householdProfile],
  );

  if (projects.length < 2) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-10 text-center">
        <p className="text-sm text-stone-600">
          You need at least two projects to compare. Create another project from the Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Household context */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-5 py-3 flex items-center justify-between">
        <div className="text-xs text-amber-800">
          <span className="font-semibold">Household: </span>
          €{fmt(householdProfile.starting_cash)} starting · €{fmt(householdProfile.monthly_savings_rate)}/mo savings ·
          Partner €{fmt(householdProfile.partner_income)}/yr
        </div>
        <a href="/en/settings" className="text-xs text-amber-700 underline hover:text-amber-900">Edit</a>
      </div>

      {/* Project selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Project A</label>
          <select
            value={projectIdA}
            onChange={(e) => setProjectIdA(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.project_type === 'private_homestead' ? 'Homestead' : 'Hosting'})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Project B</label>
          <select
            value={projectIdB}
            onChange={(e) => setProjectIdB(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.project_type === 'private_homestead' ? 'Homestead' : 'Hosting'})</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-sm text-stone-500 animate-pulse">Loading comparison data…</p>
        </div>
      )}

      {!loading && metricsA && metricsB && (
        <>
          {/* Financial comparison table */}
          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200">
              <div className="px-4 py-3 text-xs font-semibold text-stone-500">Metric</div>
              <div className="px-4 py-3 text-xs font-semibold text-stone-700 text-right">
                {dataA?.projectName}
              </div>
              <div className="px-4 py-3 text-xs font-semibold text-stone-700 text-right">
                {dataB?.projectName}
              </div>
            </div>

            <MetricRow label="Purchase price" valueA={metricsA.purchasePrice} valueB={metricsB.purchasePrice} highlight="lower" />
            <MetricRow label="Renovation cost" valueA={metricsA.renovationCost} valueB={metricsB.renovationCost} highlight="lower" />
            <MetricRow label="Contingency (20%)" valueA={metricsA.contingency} valueB={metricsB.contingency} />
            <MetricRow label="Total investment" valueA={metricsA.totalInvestment} valueB={metricsB.totalInvestment} highlight="lower" />

            <div className="h-px bg-stone-200" />

            <MetricRow label="Renovation duration" valueA={metricsA.renovationDuration} valueB={metricsB.renovationDuration} format="text" />
            <MetricRow label="Ongoing work" valueA={metricsA.ongoingWorkHours} valueB={metricsB.ongoingWorkHours} format="text" />

            <div className="h-px bg-stone-200" />

            <MetricRow label="Annual property income" valueA={metricsA.annualPropertyIncome} valueB={metricsB.annualPropertyIncome} highlight="higher" />
            <MetricRow label="Annual operating cost" valueA={metricsA.annualOperatingCost} valueB={metricsB.annualOperatingCost} highlight="lower" />
            <MetricRow label="Net from property" valueA={metricsA.netFromProperty} valueB={metricsB.netFromProperty} highlight="higher" />
            <MetricRow label="Household total (property + partner)" valueA={metricsA.householdIncome} valueB={metricsB.householdIncome} highlight="higher" />

            <div className="h-px bg-stone-200" />

            <MetricRow label="Cash remaining after project" valueA={metricsA.cashRemaining} valueB={metricsB.cashRemaining} highlight="higher" />
            <MetricRow label="Privacy level" valueA={metricsA.privacyLevel} valueB={metricsB.privacyLevel} format="text" />
            <MetricRow label="Exit / resale value" valueA={metricsA.exitValue} valueB={metricsB.exitValue} format="text" />
          </div>

          {/* Qualitative cards */}
          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-4">Quality of Life Comparison</h2>
            <div className="space-y-3">
              {qualitativeItems.map((item) => (
                <QualitativeCard key={item.label} item={item} />
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && (!metricsA || !metricsB) && dataA && dataB && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-8 text-center">
          <p className="text-sm text-stone-600">
            {!metricsA && `"${dataA.projectName}" has no property or scenario data yet. `}
            {!metricsB && `"${dataB.projectName}" has no property or scenario data yet. `}
            Add a property and generate scenarios to compare.
          </p>
        </div>
      )}
    </div>
  );
}
