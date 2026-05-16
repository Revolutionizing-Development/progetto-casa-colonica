'use client';

import { useState, useMemo } from 'react';
import { createFundingSource, updateFundingStatus, deleteFundingSource } from '@/app/actions/funding';
import type { FundingSource } from '@/types/financial';

function fmtEur(n: number) { return `€${n.toLocaleString('en-US')}`; }
function fmtUsd(n: number) { return `$${n.toLocaleString('en-US')}`; }

const TYPE_OPTIONS: { value: FundingSource['type']; label: string }[] = [
  { value: 'property_sale', label: 'Property sale' },
  { value: 'investment_liquidation', label: 'Investment liquidation' },
  { value: 'salary_savings', label: 'Salary/savings' },
  { value: 'existing_cash', label: 'Existing cash' },
  { value: 'currency_conversion', label: 'Currency conversion (USD→EUR)' },
  { value: 'mortgage', label: 'Italian mortgage' },
];

const STATUS_OPTIONS: { value: FundingSource['status']; label: string; color: string }[] = [
  { value: 'planned', label: 'Planned', color: 'bg-stone-100 text-stone-600' },
  { value: 'in_progress', label: 'In progress', color: 'bg-blue-50 text-blue-700' },
  { value: 'complete', label: 'Complete', color: 'bg-amber-50 text-amber-700' },
  { value: 'received', label: 'Received', color: 'bg-emerald-50 text-emerald-700' },
];

interface Props {
  propertyId: string;
  initialSources: FundingSource[];
  totalInvestment?: number;
}

export default function FundingPanel({ propertyId, initialSources, totalInvestment }: Props) {
  const [sources, setSources] = useState(initialSources);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [type, setType] = useState<FundingSource['type']>('existing_cash');
  const [description, setDescription] = useState('');
  const [amountUsd, setAmountUsd] = useState(0);
  const [amountEur, setAmountEur] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0.92);
  const [status, setStatus] = useState<FundingSource['status']>('planned');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');

  const totals = useMemo(() => {
    const totalFunded = sources.reduce((s, f) => s + f.amount_eur, 0);
    const received = sources.filter((f) => f.status === 'received').reduce((s, f) => s + f.amount_eur, 0);
    const pending = totalFunded - received;
    const gap = totalInvestment ? Math.max(0, totalInvestment - totalFunded) : 0;
    return { totalFunded, received, pending, gap };
  }, [sources, totalInvestment]);

  function resetForm() {
    setType('existing_cash');
    setDescription('');
    setAmountUsd(0);
    setAmountEur(0);
    setExchangeRate(0.92);
    setStatus('planned');
    setExpectedDate('');
    setNotes('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const result = await createFundingSource(propertyId, {
      type,
      description,
      amount_usd: amountUsd > 0 ? amountUsd : undefined,
      amount_eur: amountEur,
      status,
      expected_date: expectedDate || undefined,
      exchange_rate: exchangeRate > 0 ? exchangeRate : undefined,
      notes: notes || undefined,
    });

    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSources((prev) => [...prev, result.data!]);
      resetForm();
      setShowForm(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: FundingSource['status']) {
    const actualDate = newStatus === 'received' ? new Date().toISOString().split('T')[0] : undefined;
    const result = await updateFundingStatus(id, newStatus, actualDate);
    if (!result.error) {
      setSources((prev) => prev.map((s) =>
        s.id === id ? { ...s, status: newStatus, actual_date: actualDate ?? s.actual_date } : s
      ));
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteFundingSource(id);
    if (!result.error) {
      setSources((prev) => prev.filter((s) => s.id !== id));
    }
  }

  const isCurrencyType = type === 'currency_conversion';

  return (
    <section className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total funded" value={fmtEur(totals.totalFunded)} />
        <SummaryCard label="Received" value={fmtEur(totals.received)} highlight="green" />
        <SummaryCard label="Pending" value={fmtEur(totals.pending)} highlight={totals.pending > 0 ? 'amber' : undefined} />
        {totalInvestment && (
          <SummaryCard
            label="Funding gap"
            value={totals.gap > 0 ? fmtEur(totals.gap) : 'Fully funded'}
            highlight={totals.gap > 0 ? 'red' : 'green'}
          />
        )}
      </div>

      {/* Progress bar */}
      {totalInvestment && totalInvestment > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Funded: {fmtEur(totals.totalFunded)}</span>
            <span>Required: {fmtEur(totalInvestment)}</span>
          </div>
          <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${totals.totalFunded >= totalInvestment ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (totals.totalFunded / totalInvestment) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Sources list */}
      {sources.length > 0 && (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="px-5 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Source</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => {
                  const statusInfo = STATUS_OPTIONS.find((s) => s.value === src.status);
                  return (
                    <tr key={src.id} className="border-b border-stone-100 last:border-0">
                      <td className="px-5 py-2.5">
                        <span className="font-medium text-stone-700">{src.description}</span>
                        {src.notes && <p className="text-xs text-stone-400 mt-0.5">{src.notes}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-stone-500 text-xs">
                        {TYPE_OPTIONS.find((t) => t.value === src.type)?.label ?? src.type}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="font-medium text-stone-900">{fmtEur(src.amount_eur)}</span>
                        {src.amount_usd && src.amount_usd > 0 && (
                          <span className="block text-xs text-stone-400">
                            {fmtUsd(src.amount_usd)} @ {src.exchange_rate?.toFixed(4)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={src.status}
                          onChange={(e) => handleStatusChange(src.id, e.target.value as FundingSource['status'])}
                          className={`text-xs font-medium rounded-full px-2.5 py-1 border ${statusInfo?.color ?? ''}`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-stone-500 text-xs">
                        {src.actual_date ?? src.expected_date ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(src.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-stone-200 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-stone-700">Add Funding Source</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FundingSource['type'])}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FundingSource['status'])}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Sale of Chicago condo"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isCurrencyType && (
              <div>
                <label className="block text-xs text-stone-500 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  value={amountUsd || ''}
                  onChange={(e) => {
                    const usd = Number(e.target.value);
                    setAmountUsd(usd);
                    if (exchangeRate > 0) setAmountEur(Math.round(usd * exchangeRate));
                  }}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-stone-500 mb-1">Amount (EUR)</label>
              <input
                type="number"
                value={amountEur || ''}
                onChange={(e) => setAmountEur(Number(e.target.value))}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            {isCurrencyType && (
              <div>
                <label className="block text-xs text-stone-500 mb-1">Exchange rate (EUR/USD)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={exchangeRate || ''}
                  onChange={(e) => {
                    const rate = Number(e.target.value);
                    setExchangeRate(rate);
                    if (amountUsd > 0 && rate > 0) setAmountEur(Math.round(amountUsd * rate));
                  }}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Expected date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Source'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-sm text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-colors"
        >
          + Add funding source
        </button>
      )}
    </section>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'amber' | 'red' }) {
  const bgColor = highlight === 'red' ? 'bg-red-50 border-red-200'
    : highlight === 'amber' ? 'bg-amber-50 border-amber-200'
    : highlight === 'green' ? 'bg-emerald-50 border-emerald-200'
    : 'bg-white border-stone-200';

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-stone-900">{value}</p>
    </div>
  );
}
