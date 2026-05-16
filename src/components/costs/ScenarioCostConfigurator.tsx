'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ScopeTogglePanel from './ScopeTogglePanel';
import DIYProfilePanel from './DIYProfilePanel';
import PhaseTimeline from './PhaseTimeline';
import ProjectTimeline from '@/components/financial/ProjectTimeline';
import { computeScenarioCosts, type QuantityOverrides } from '@/lib/financial/scenario-cost-calculator';
import { updateScopeToggles, updatePhaseAssignments, updateDIYProfile } from '@/app/actions/scenarios';
import type { ScopeToggles, DIYToggles, PhaseAssignments, ScenarioCostSummary } from '@/types/cost-config';
import type { RegionalMultiplierKey } from '@/config/cost-line-items';
import { REGIONAL_MULTIPLIERS } from '@/config/cost-line-items';
import type { HouseholdProfile } from '@/types/household';

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

type ActiveTab = 'scope' | 'diy' | 'phasing' | 'timeline';

function useDebouncedSave<T>(
  saveFn: (value: T) => Promise<unknown>,
  delay = 800,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    (value: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await saveFn(value);
        } finally {
          setSaving(false);
        }
      }, delay);
    },
    [saveFn, delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { save, saving };
}

interface Props {
  propertyId: string;
  projectId: string;
  scenarioId: string;
  scenarioType: string;
  scenarioName: string;
  purchasePrice: number;
  householdProfile: HouseholdProfile;
  initialRegion: RegionalMultiplierKey;
  initialScope: ScopeToggles;
  initialDiy: DIYToggles;
  initialPhases: PhaseAssignments;
  initialQuantities: QuantityOverrides;
}

export default function ScenarioCostConfigurator({
  projectId,
  scenarioId,
  scenarioType,
  scenarioName,
  purchasePrice,
  householdProfile,
  initialRegion,
  initialScope,
  initialDiy,
  initialPhases,
  initialQuantities,
}: Props) {
  const [region, setRegion] = useState<RegionalMultiplierKey>(initialRegion);
  const [scopeToggles, setScopeToggles] = useState<ScopeToggles>(initialScope);
  const [diyToggles, setDiyToggles] = useState<DIYToggles>(initialDiy);
  const [phaseAssignments, setPhaseAssignments] = useState<PhaseAssignments>(initialPhases);
  const [quantities] = useState<QuantityOverrides>(initialQuantities);
  const [activeTab, setActiveTab] = useState<ActiveTab>('scope');

  const saveScope = useCallback(
    (val: ScopeToggles) => updateScopeToggles(scenarioId, val),
    [scenarioId],
  );
  const savePhases = useCallback(
    (val: PhaseAssignments) => updatePhaseAssignments(scenarioId, val),
    [scenarioId],
  );
  const saveDiy = useCallback(
    (val: DIYToggles) => updateDIYProfile(projectId, val),
    [projectId],
  );

  const { save: debounceSaveScope, saving: savingScope } = useDebouncedSave(saveScope);
  const { save: debounceSavePhases, saving: savingPhases } = useDebouncedSave(savePhases);
  const { save: debounceSaveDiy, saving: savingDiy } = useDebouncedSave(saveDiy);

  const isSaving = savingScope || savingPhases || savingDiy;

  function handleScopeChange(next: ScopeToggles) {
    setScopeToggles(next);
    debounceSaveScope(next);
  }

  function handleDiyChange(next: DIYToggles) {
    setDiyToggles(next);
    debounceSaveDiy(next);
  }

  function handlePhaseChange(next: PhaseAssignments) {
    setPhaseAssignments(next);
    debounceSavePhases(next);
  }

  const summary: ScenarioCostSummary = useMemo(
    () =>
      computeScenarioCosts({
        region,
        scopeToggles,
        diyToggles,
        phaseAssignments,
        quantities,
      }),
    [region, scopeToggles, diyToggles, phaseAssignments, quantities],
  );

  const tabs: { key: ActiveTab; label: string; sublabel: string }[] = [
    { key: 'scope', label: 'Scope', sublabel: 'What to include' },
    { key: 'diy', label: 'DIY', sublabel: 'What you do yourself' },
    { key: 'phasing', label: 'Phasing', sublabel: 'When to spend' },
    { key: 'timeline', label: 'Timeline', sublabel: '48-month plan' },
  ];

  return (
    <div className="space-y-6">
      {/* Cost summary header */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-6 py-5 bg-stone-50 border-b border-stone-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                  {scenarioType === 'basic' ? 'Basic' : 'Lifestyle'} Scenario
                </p>
                {isSaving && (
                  <span className="text-xs text-amber-600 animate-pulse">Saving…</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-stone-900 mt-0.5">{scenarioName}</h2>
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as RegionalMultiplierKey)}
              className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 bg-white"
            >
              {Object.entries(REGIONAL_MULTIPLIERS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label} (×{val.multiplier.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-stone-100">
          <div className="bg-white px-5 py-4 text-center">
            <p className="text-xs text-stone-400">Contractor</p>
            <p className="text-base font-bold text-stone-900 tabular-nums">€{fmt(summary.totalContractor)}</p>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <p className="text-xs text-emerald-600">DIY savings</p>
            <p className="text-base font-bold text-emerald-700 tabular-nums">
              {summary.totalDiySavings > 0 ? `–€${fmt(summary.totalDiySavings)}` : '€0'}
            </p>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <p className="text-xs text-stone-400">Effective cost</p>
            <p className="text-base font-bold text-stone-900 tabular-nums">€{fmt(summary.totalEffective)}</p>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <p className="text-xs text-amber-600">+ Contingency 20%</p>
            <p className="text-base font-bold text-amber-700 tabular-nums">€{fmt(summary.contingencyAmount)}</p>
          </div>
          <div className="bg-amber-50 px-5 py-4 text-center col-span-2 md:col-span-1">
            <p className="text-xs text-amber-700 font-semibold">Grand Total</p>
            <p className="text-lg font-black text-amber-800 tabular-nums">€{fmt(summary.grandTotal)}</p>
          </div>
        </div>

        {summary.totalOngoingAnnual > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 text-center">
            <p className="text-xs text-blue-700">
              + <span className="font-bold">€{fmt(summary.totalOngoingAnnual)}/year</span> ongoing operating costs
            </p>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-xl border text-left transition-colors ${
              activeTab === tab.key
                ? 'border-amber-300 bg-amber-50'
                : 'border-stone-200 bg-white hover:bg-stone-50'
            }`}
          >
            <p className={`text-sm font-semibold ${activeTab === tab.key ? 'text-amber-800' : 'text-stone-700'}`}>
              {tab.label}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{tab.sublabel}</p>
          </button>
        ))}
      </div>

      {/* Active panel */}
      {activeTab === 'scope' && (
        <ScopeTogglePanel toggles={scopeToggles} onChange={handleScopeChange} />
      )}

      {activeTab === 'diy' && (
        <DIYProfilePanel diyToggles={diyToggles} onChange={handleDiyChange} />
      )}

      {activeTab === 'phasing' && (
        <PhaseTimeline
          items={summary.items}
          phaseAssignments={phaseAssignments}
          purchasePrice={purchasePrice}
          householdProfile={householdProfile}
          onChange={handlePhaseChange}
        />
      )}

      {activeTab === 'timeline' && (
        <ProjectTimeline
          costSummary={summary}
          purchasePrice={purchasePrice}
          householdProfile={householdProfile}
        />
      )}

      {/* Category breakdown */}
      <div className="rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">Cost Breakdown by Category</h3>
        </div>
        <div className="divide-y divide-stone-100">
          {summary.byCategory.map((cat) => (
            <div key={cat.category} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-stone-800">{cat.label}</p>
                <p className="text-xs text-stone-400 italic">{cat.label_it}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-stone-800 tabular-nums">
                  €{fmt(cat.effectiveTotal)}
                </p>
                {cat.contractorTotal !== cat.effectiveTotal && (
                  <p className="text-xs text-emerald-600 tabular-nums">
                    was €{fmt(cat.contractorTotal)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
