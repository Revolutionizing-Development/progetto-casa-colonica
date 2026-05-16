'use client';

import { useState } from 'react';
import {
  COST_LINE_ITEMS,
  ALL_CATEGORIES,
  type CostLineItem,
  type ItemCategory,
} from '@/config/cost-line-items';
import type { ScopeToggles } from '@/types/cost-config';

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

const TOGGLEABLE_CATEGORIES: ItemCategory[] = [
  'energy', 'vehicles_equipment', 'swimming_pool', 'home_gym',
  'greenhouse_growing', 'perimeter_security', 'outdoor_hospitality',
  'livestock', 'transition_setup', 'operating',
];

function ToggleGroupSection({
  groupKey,
  items,
  toggles,
  onToggle,
  onRadioSelect,
}: {
  groupKey: string;
  items: CostLineItem[];
  toggles: ScopeToggles;
  onToggle: (key: string, value: boolean) => void;
  onRadioSelect: (radioGroup: string, selectedKey: string) => void;
}) {
  const radioGroups = new Map<string, CostLineItem[]>();
  const standaloneItems: CostLineItem[] = [];

  for (const item of items) {
    if (item.radioGroup) {
      const group = radioGroups.get(item.radioGroup) ?? [];
      group.push(item);
      radioGroups.set(item.radioGroup, group);
    } else {
      standaloneItems.push(item);
    }
  }

  const allGroupOn = items.some((i) => toggles[i.key]);

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <button
        onClick={() => {
          const newVal = !allGroupOn;
          for (const item of items) {
            onToggle(item.key, newVal);
          }
        }}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-stone-800 capitalize">
          {groupKey.replace(/_/g, ' ')}
        </span>
        <div className={`w-10 h-5 rounded-full transition-colors relative ${allGroupOn ? 'bg-amber-500' : 'bg-stone-300'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${allGroupOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </button>

      {allGroupOn && (
        <div className="px-4 py-3 space-y-3 border-t border-stone-100">
          {/* Radio groups */}
          {Array.from(radioGroups.entries()).map(([radioKey, radioItems]) => (
            <div key={radioKey} className="space-y-1">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
                {radioKey.replace(/_/g, ' ')}
              </p>
              {radioItems.map((item) => {
                const selected = toggles[item.key] === true ||
                  (!radioItems.some((ri) => toggles[ri.key] === true) && radioItems[0].key === item.key);
                return (
                  <label
                    key={item.key}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${selected ? 'bg-amber-50 border border-amber-200' : 'hover:bg-stone-50 border border-transparent'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name={radioKey}
                        checked={selected}
                        onChange={() => onRadioSelect(radioKey, item.key)}
                        className="accent-amber-600"
                      />
                      <span className="text-sm text-stone-700">{item.description}</span>
                    </div>
                    <span className="text-sm text-stone-500 tabular-nums">
                      €{fmt(item.unitCost)}
                      {item.unitType !== 'forfait' && ` /${item.unitType.replace('_', '.')}`}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}

          {/* Standalone toggleable items */}
          {standaloneItems.map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={toggles[item.key] ?? false}
                  onChange={(e) => onToggle(item.key, e.target.checked)}
                  className="accent-amber-600 w-4 h-4"
                />
                <div>
                  <span className="text-sm text-stone-700">{item.description}</span>
                  {item.isOngoing && (
                    <span className="ml-1.5 text-xs text-blue-600">(ongoing)</span>
                  )}
                </div>
              </div>
              <span className="text-sm text-stone-500 tabular-nums">
                €{fmt(item.unitCost)}
                {item.unitType !== 'forfait' && `/${item.unitType.replace('_', '.')}`}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  toggles: ScopeToggles;
  onChange: (toggles: ScopeToggles) => void;
}

export default function ScopeTogglePanel({ toggles, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  const toggleableItems = COST_LINE_ITEMS.filter((i) => i.toggleable);
  const toggleGroups = new Map<string, CostLineItem[]>();
  const ungrouped: CostLineItem[] = [];

  for (const item of toggleableItems) {
    if (item.toggleGroup) {
      const group = toggleGroups.get(item.toggleGroup) ?? [];
      group.push(item);
      toggleGroups.set(item.toggleGroup, group);
    } else {
      ungrouped.push(item);
    }
  }

  function handleToggle(key: string, value: boolean) {
    onChange({ ...toggles, [key]: value });
  }

  function handleRadioSelect(radioGroup: string, selectedKey: string) {
    const radioItems = COST_LINE_ITEMS.filter((i) => i.radioGroup === radioGroup);
    const updates: ScopeToggles = {};
    for (const item of radioItems) {
      updates[item.key] = item.key === selectedKey;
    }
    onChange({ ...toggles, ...updates });
  }

  const enabledCount = toggleableItems.filter((i) => toggles[i.key]).length;

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Scope</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {enabledCount} optional items enabled
          </p>
        </div>
        <span className="text-stone-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-3">
          {Array.from(toggleGroups.entries()).map(([groupKey, items]) => (
            <ToggleGroupSection
              key={groupKey}
              groupKey={groupKey}
              items={items}
              toggles={toggles}
              onToggle={handleToggle}
              onRadioSelect={handleRadioSelect}
            />
          ))}

          {ungrouped.map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={toggles[item.key] ?? false}
                  onChange={(e) => handleToggle(item.key, e.target.checked)}
                  className="accent-amber-600 w-4 h-4"
                />
                <span className="text-sm text-stone-700">{item.description}</span>
              </div>
              <span className="text-sm text-stone-500 tabular-nums">
                €{fmt(item.unitCost)}/{item.unitType.replace('_', '.')}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
