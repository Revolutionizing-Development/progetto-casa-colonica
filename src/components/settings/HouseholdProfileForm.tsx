'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { HouseholdProfile } from '@/types/household';
import { updateHouseholdProfile } from '@/app/actions/household';

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function Field({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-stone-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        {sublabel && <p className="text-xs text-stone-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface Props {
  initialProfile: HouseholdProfile;
}

export default function HouseholdProfileForm({ initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const save = useCallback(
    (updates: Partial<HouseholdProfile>) => {
      const next = { ...profile, ...updates };
      setProfile(next);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          const { id, user_id, created_at, updated_at, ...fields } = next;
          await updateHouseholdProfile(fields);
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [profile],
  );

  return (
    <div className="space-y-8">
      {/* Household Finances */}
      <section className="rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Household Finances</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              These values flow into every project&apos;s financial model
            </p>
          </div>
          {saving && <span className="text-xs text-amber-600 animate-pulse">Saving…</span>}
        </div>

        <div className="px-6">
          <Field label="Starting cash" sublabel="Total available for property acquisition + renovation">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-stone-400">€</span>
              <input
                type="number"
                value={profile.starting_cash}
                onChange={(e) => save({ starting_cash: parseInt(e.target.value) || 0 })}
                className="w-32 text-right text-sm border border-stone-200 rounded-lg px-3 py-1.5 tabular-nums"
                step={10000}
              />
            </div>
          </Field>

          <Field label="Partner income" sublabel="Annual income — continues during and after move">
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-400">€</span>
              <input
                type="number"
                value={profile.partner_income}
                onChange={(e) => save({ partner_income: parseInt(e.target.value) || 0 })}
                className="w-28 text-right text-sm border border-stone-200 rounded-lg px-3 py-1.5 tabular-nums"
                step={5000}
              />
              <span className="text-xs text-stone-400">/year</span>
            </div>
          </Field>

          <Field label="Partner income location" sublabel="Affects tax regime (impatriati eligible in Italy)">
            <select
              value={profile.partner_income_location}
              onChange={(e) => save({ partner_income_location: e.target.value as 'us' | 'italy' })}
              className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700"
            >
              <option value="us">US employer</option>
              <option value="italy">Italy-based</option>
            </select>
          </Field>

          <Field label="Impatriati eligible" sublabel="30% income exemption for new Italian residents">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.impatriat_eligible}
                onChange={(e) => save({ impatriat_eligible: e.target.checked })}
                className="accent-amber-600"
              />
              <span className="text-sm text-stone-600">Eligible</span>
            </label>
          </Field>

          <Field label="Monthly savings rate" sublabel="Amount saved per month while in the US">
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-400">€</span>
              <input
                type="number"
                value={profile.monthly_savings_rate}
                onChange={(e) => save({ monthly_savings_rate: parseInt(e.target.value) || 0 })}
                className="w-24 text-right text-sm border border-stone-200 rounded-lg px-3 py-1.5 tabular-nums"
                step={1000}
              />
              <span className="text-xs text-stone-400">/mo</span>
            </div>
          </Field>

          <Field label="Annual living costs in Italy" sublabel="Food, utilities, transport, health, daily life">
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-400">€</span>
              <input
                type="number"
                value={profile.annual_living_costs}
                onChange={(e) => save({ annual_living_costs: parseInt(e.target.value) || 0 })}
                className="w-28 text-right text-sm border border-stone-200 rounded-lg px-3 py-1.5 tabular-nums"
                step={5000}
              />
              <span className="text-xs text-stone-400">/year</span>
            </div>
          </Field>

          <Field label="Adults" sublabel="People in the household">
            <input
              type="number"
              value={profile.adults}
              onChange={(e) => save({ adults: parseInt(e.target.value) || 1 })}
              className="w-16 text-right text-sm border border-stone-200 rounded-lg px-3 py-1.5 tabular-nums"
              min={1}
              max={6}
            />
          </Field>
        </div>
      </section>

      {/* Timeline */}
      <section className="rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-900">Timeline</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            How long each phase lasts — affects funding and cash flow
          </p>
        </div>

        <div className="px-6">
          <Field label="US phase duration" sublabel="Remote-managed contractor renovation from the US">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={profile.us_phase_months}
                onChange={(e) => save({ us_phase_months: parseInt(e.target.value) || 12 })}
                className="w-16 text-right text-sm border border-stone-200 rounded-lg px-3 py-1.5 tabular-nums"
                min={6}
                max={48}
              />
              <span className="text-xs text-stone-400">months</span>
            </div>
          </Field>

          <Field label="DIY phase duration" sublabel="On-site owner DIY work after moving to Italy">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={profile.diy_phase_months}
                onChange={(e) => save({ diy_phase_months: parseInt(e.target.value) || 12 })}
                className="w-16 text-right text-sm border border-stone-200 rounded-lg px-3 py-1.5 tabular-nums"
                min={6}
                max={48}
              />
              <span className="text-xs text-stone-400">months</span>
            </div>
          </Field>

          <Field label="Target move date" sublabel="When you plan to relocate to Italy">
            <input
              type="month"
              value={profile.move_date?.slice(0, 7) ?? ''}
              onChange={(e) => save({ move_date: e.target.value ? `${e.target.value}-01` : null })}
              className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700"
            />
          </Field>
        </div>
      </section>

      {/* Import */}
      <section className="rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-900">Property Import</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Default folder for listing files and photos
          </p>
        </div>
        <div className="px-6">
          <Field label="Import folder" sublabel="Local folder where you save listing HTML files and photos">
            <input
              type="text"
              value={profile.import_folder ?? ''}
              onChange={(e) => save({ import_folder: e.target.value || null })}
              placeholder="C:\Users\you\Downloads\properties"
              className="w-72 text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 placeholder:text-stone-300"
            />
          </Field>
        </div>
      </section>

      {/* Summary */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-5 py-4">
        <p className="text-xs font-semibold text-amber-800 mb-2">Financial Summary</p>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-stone-500">Starting cash</p>
            <p className="font-bold text-stone-800 tabular-nums">€{fmt(profile.starting_cash)}</p>
          </div>
          <div>
            <p className="text-stone-500">Savings during US phase</p>
            <p className="font-bold text-stone-800 tabular-nums">
              €{fmt(profile.monthly_savings_rate * profile.us_phase_months)}
            </p>
          </div>
          <div>
            <p className="text-stone-500">Total at move date</p>
            <p className="font-bold text-amber-800 tabular-nums">
              €{fmt(profile.starting_cash + profile.monthly_savings_rate * profile.us_phase_months)}
            </p>
          </div>
          <div>
            <p className="text-stone-500">Partner income (post-move)</p>
            <p className="font-bold text-stone-800 tabular-nums">€{fmt(profile.partner_income)}/year</p>
          </div>
        </div>
      </div>
    </div>
  );
}
