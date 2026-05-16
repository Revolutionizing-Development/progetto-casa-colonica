'use client';

import { useState } from 'react';
import { COST_LINE_ITEMS, ALL_CATEGORIES, type ItemCategory } from '@/config/cost-line-items';
import type { DIYToggles } from '@/types/cost-config';

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

const DIY_CATEGORIES: ItemCategory[] = [
  'structural_envelope', 'interior_finishes', 'guest_separation',
  'greenhouse_growing', 'perimeter_security', 'outdoor_hospitality',
  'livestock', 'site_work', 'transition_setup', 'home_gym',
];

function DIYCategorySection({
  category,
  label,
  diyToggles,
  onToggle,
}: {
  category: ItemCategory;
  label: string;
  diyToggles: DIYToggles;
  onToggle: (key: string, value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const items = COST_LINE_ITEMS.filter(
    (i) => i.category === category && i.diyLaborPercent > 0,
  );
  if (items.length === 0) return null;

  const enabledCount = items.filter((i) => diyToggles[i.key]).length;
  const totalSavings = items.reduce((sum, item) => {
    if (!diyToggles[item.key]) return sum;
    return sum + Math.round(item.unitCost * (item.diyLaborPercent / 100));
  }, 0);

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-stone-800">{label}</span>
          {enabledCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              {enabledCount} DIY
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalSavings > 0 && (
            <span className="text-xs text-emerald-600 font-medium">
              –€{fmt(totalSavings)} saved
            </span>
          )}
          <span className="text-stone-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 space-y-1 border-t border-stone-100">
          {items.map((item) => {
            const laborSaving = Math.round(item.unitCost * (item.diyLaborPercent / 100));
            const enabled = diyToggles[item.key] ?? false;

            return (
              <label
                key={item.key}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${enabled ? 'bg-emerald-50' : 'hover:bg-stone-50'}`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onToggle(item.key, e.target.checked)}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm text-stone-700">{item.description}</span>
                    <span className="text-xs text-stone-400 ml-1.5">
                      ({item.diyLaborPercent}% labor)
                    </span>
                  </div>
                </div>
                <span className="text-xs text-emerald-600 tabular-nums">
                  –€{fmt(laborSaving)}/unit
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LockedItemsSection() {
  const locked = COST_LINE_ITEMS.filter(
    (i) => i.isRegulated && i.diyLaborPercent === 0,
  );
  const [open, setOpen] = useState(false);

  const categories = new Set(locked.map((i) => i.category));

  return (
    <div className="rounded-lg border border-red-100 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-red-800">Regulated — No DIY</span>
          <span className="text-xs text-red-600">
            {locked.length} items locked (N4)
          </span>
        </div>
        <span className="text-red-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-3 border-t border-red-100">
          <p className="text-xs text-red-700 mb-3">
            These items require licensed Italian professionals. Electrical, structural, gas, seismic, and plumbing work cannot be DIY regardless of your skills.
          </p>
          <div className="space-y-1">
            {locked.slice(0, 15).map((item) => (
              <div key={item.key} className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-400">
                <span className="w-4 h-4 flex items-center justify-center text-red-400 text-xs">✕</span>
                <span>{item.description}</span>
              </div>
            ))}
            {locked.length > 15 && (
              <p className="text-xs text-stone-400 px-3 py-1">
                +{locked.length - 15} more regulated items
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  diyToggles: DIYToggles;
  onChange: (diyToggles: DIYToggles) => void;
}

export default function DIYProfilePanel({ diyToggles, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  const allDiyEligible = COST_LINE_ITEMS.filter((i) => i.diyLaborPercent > 0 && !i.isRegulated);
  const enabledCount = allDiyEligible.filter((i) => diyToggles[i.key]).length;
  const totalSavings = allDiyEligible.reduce((sum, item) => {
    if (!diyToggles[item.key]) return sum;
    return sum + Math.round(item.unitCost * (item.diyLaborPercent / 100));
  }, 0);

  function handleToggle(key: string, value: boolean) {
    onChange({ ...diyToggles, [key]: value });
  }

  function handleToggleAll(on: boolean) {
    const updates: DIYToggles = {};
    for (const item of allDiyEligible) {
      updates[item.key] = on;
    }
    onChange({ ...diyToggles, ...updates });
  }

  return (
    <div className="rounded-xl border border-emerald-200 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-emerald-900">DIY Profile</h3>
          <p className="text-xs text-emerald-700 mt-0.5">
            {enabledCount}/{allDiyEligible.length} items DIY
            {totalSavings > 0 && ` · saving €${fmt(totalSavings)}`}
          </p>
        </div>
        <span className="text-emerald-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleAll(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              DIY everything eligible
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              All contractor
            </button>
          </div>

          {DIY_CATEGORIES.map((cat) => {
            const meta = ALL_CATEGORIES.find((c) => c.key === cat);
            if (!meta) return null;
            return (
              <DIYCategorySection
                key={cat}
                category={cat}
                label={meta.label}
                diyToggles={diyToggles}
                onToggle={handleToggle}
              />
            );
          })}

          <LockedItemsSection />
        </div>
      )}
    </div>
  );
}
