'use client';

import { useState, useMemo } from 'react';
import { createInvoice, deleteInvoice } from '@/app/actions/invoices';
import { TAX_BONUSES, BONIFICO_TEMPLATES } from '@/config/tax-bonuses';
import type { Invoice, TaxDeductionTracker, TaxBonus, PaymentMethod } from '@/types/invoice';

function fmt(n: number) { return n.toLocaleString('en-US'); }
function fmtEur(n: number) { return `€${fmt(n)}`; }

const IVA_RATES = [
  { label: '22% (standard)', value: 22 },
  { label: '10% (renovations)', value: 10 },
  { label: '4% (essentials)', value: 4 },
  { label: '0% (exempt)', value: 0 },
];

const BONUS_OPTIONS: { value: TaxBonus; label: string }[] = [
  { value: 'none', label: 'No bonus' },
  { value: 'ristrutturazione', label: 'Ristrutturazione 50%' },
  { value: 'ecobonus', label: 'Ecobonus 50%' },
  { value: 'sismabonus', label: 'Sismabonus 50%' },
  { value: 'mobili', label: 'Bonus Mobili 50%' },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'bonifico_parlante', label: 'Bonifico parlante' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'regular_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
];

const BONUS_COLORS: Record<TaxBonus, string> = {
  ristrutturazione: 'bg-blue-50 text-blue-700 border-blue-200',
  ecobonus: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sismabonus: 'bg-purple-50 text-purple-700 border-purple-200',
  mobili: 'bg-amber-50 text-amber-700 border-amber-200',
  none: 'bg-stone-50 text-stone-500 border-stone-200',
};

function BonusBar({ label, spent, cap }: { label: string; spent: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
  const remaining = Math.max(0, cap - spent);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="text-stone-400">{fmtEur(spent)} / {fmtEur(cap)}</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-stone-400">{fmtEur(remaining)} remaining</p>
    </div>
  );
}

interface Props {
  propertyId: string;
  initialInvoices: Invoice[];
  initialTracker: TaxDeductionTracker | null;
  codiceFiscale?: string;
}

export default function InvoicePanel({
  propertyId,
  initialInvoices,
  initialTracker,
  codiceFiscale,
}: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [tracker, setTracker] = useState<TaxDeductionTracker | null>(initialTracker);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [vendorName, setVendorName] = useState('');
  const [vendorPiva, setVendorPiva] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [amountExcl, setAmountExcl] = useState(0);
  const [ivaRate, setIvaRate] = useState(10);
  const [description, setDescription] = useState('');
  const [taxBonus, setTaxBonus] = useState<TaxBonus>('ristrutturazione');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bonifico_parlante');
  const [notes, setNotes] = useState('');

  const ivaAmount = Math.round(amountExcl * (ivaRate / 100));
  const totalAmount = amountExcl + ivaAmount;

  const bonificoText = useMemo(() => {
    if (taxBonus === 'none' || taxBonus === 'mobili') return '';
    const template = BONIFICO_TEMPLATES[taxBonus];
    if (!template) return '';
    return template
      .replace('{INVOICE_NO}', invoiceNo || '___')
      .replace('{DATE}', invoiceDate || '___')
      .replace('{DESC}', description || '___')
      .replace('{CODICE_FISCALE}', codiceFiscale || '___')
      .replace('{PARTITA_IVA}', vendorPiva || '___');
  }, [taxBonus, invoiceNo, invoiceDate, description, codiceFiscale, vendorPiva]);

  const isTaxDeductible =
    taxBonus !== 'none' &&
    (paymentMethod === 'bonifico_parlante' ||
      (taxBonus === 'mobili' && paymentMethod === 'credit_card'));

  function resetForm() {
    setVendorName(''); setVendorPiva(''); setInvoiceNo(''); setInvoiceDate('');
    setAmountExcl(0); setIvaRate(10); setDescription(''); setTaxBonus('ristrutturazione');
    setPaymentMethod('bonifico_parlante'); setNotes('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await createInvoice(propertyId, {
      vendor_name: vendorName,
      vendor_partita_iva: vendorPiva || undefined,
      invoice_number: invoiceNo || undefined,
      invoice_date: invoiceDate || undefined,
      amount_excl_iva: amountExcl,
      iva_rate: ivaRate,
      iva_amount: ivaAmount,
      total_amount: totalAmount,
      description,
      tax_bonus: taxBonus,
      payment_method: paymentMethod,
      bonifico_text: bonificoText || undefined,
      notes: notes || undefined,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setInvoices((prev) => [result.data!, ...prev]);
      if (isTaxDeductible && tracker) {
        const key = `${taxBonus}_spent` as keyof TaxDeductionTracker;
        setTracker({ ...tracker, [key]: (tracker[key] as number) + totalAmount });
      }
      resetForm();
      setShowForm(false);
    }
  }

  async function handleDelete(invoiceId: string) {
    const inv = invoices.find((i) => i.id === invoiceId);
    const result = await deleteInvoice(invoiceId);
    if (result.error) {
      setError(result.error);
    } else {
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
      if (inv?.is_tax_deductible && inv.tax_bonus && inv.tax_bonus !== 'none' && tracker) {
        const key = `${inv.tax_bonus}_spent` as keyof TaxDeductionTracker;
        setTracker({ ...tracker, [key]: Math.max(0, (tracker[key] as number) - inv.total_amount) });
      }
    }
  }

  const totalSpent = invoices.reduce((sum, i) => sum + i.total_amount, 0);
  const totalDeductible = invoices.filter((i) => i.is_tax_deductible).reduce((sum, i) => sum + i.total_amount, 0);

  return (
    <section className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Invoices & Tax Tracking</h2>
          <p className="text-sm text-stone-500 mt-1">
            Record invoices, track tax bonus spending against caps, generate bonifico parlante text.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Invoice'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form + list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
                <h3 className="text-sm font-semibold text-stone-700">New Invoice</h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Vendor row */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">Vendor name *</span>
                    <input type="text" required value={vendorName} onChange={(e) => setVendorName(e.target.value)}
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">P.IVA</span>
                    <input type="text" value={vendorPiva} onChange={(e) => setVendorPiva(e.target.value)}
                      placeholder="IT 12345678901"
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </label>
                </div>
                {/* Invoice + date */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">Invoice number</span>
                    <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">Invoice date</span>
                    <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </label>
                </div>
                {/* Amount + IVA */}
                <div className="grid grid-cols-3 gap-4">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">Amount excl. IVA *</span>
                    <input type="number" required min={0} value={amountExcl || ''} onChange={(e) => setAmountExcl(Number(e.target.value))}
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">IVA rate</span>
                    <select value={ivaRate} onChange={(e) => setIvaRate(Number(e.target.value))}
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                      {IVA_RATES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </label>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">Total</span>
                    <div className="text-sm font-bold text-stone-900 py-2">{fmtEur(totalAmount)}</div>
                  </div>
                </div>
                {/* Description */}
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-stone-500">Description *</span>
                  <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Roof tile replacement"
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </label>
                {/* Tax bonus + payment */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">Tax bonus (N9: checked before recording)</span>
                    <select value={taxBonus} onChange={(e) => setTaxBonus(e.target.value as TaxBonus)}
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                      {BONUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">Payment method</span>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                      {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                </div>
                {/* Tax eligibility warning */}
                {taxBonus !== 'none' && !isTaxDeductible && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <span className="text-red-500 shrink-0">⚠</span>
                    <p className="text-xs text-red-700">
                      {taxBonus === 'mobili'
                        ? 'Bonus Mobili requires bonifico parlante or credit card.'
                        : `${TAX_BONUSES[taxBonus].name} requires bonifico parlante — switch payment method to claim this deduction.`}
                    </p>
                  </div>
                )}
                {/* Bonifico text */}
                {bonificoText && paymentMethod === 'bonifico_parlante' && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-stone-500">Bonifico parlante text (copy to bank transfer)</span>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-mono break-all select-all">
                      {bonificoText}
                    </div>
                  </div>
                )}
                {/* Notes */}
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-stone-500">Notes</span>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </label>

                <button type="submit" disabled={saving}
                  className="w-full px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {saving ? 'Saving…' : 'Record Invoice'}
                </button>
              </div>
            </form>
          )}

          {/* Invoice list */}
          {invoices.length > 0 ? (
            <div className="rounded-xl border border-stone-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-400 uppercase">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-400 uppercase">Vendor</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-400 uppercase">Description</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-stone-400 uppercase">Amount</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-stone-400 uppercase">Bonus</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-stone-400 uppercase w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/40">
                      <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">
                        {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-stone-800 font-medium">{inv.vendor_name}</td>
                      <td className="px-4 py-2.5 text-stone-600 max-w-xs truncate">{inv.description}</td>
                      <td className="px-4 py-2.5 text-stone-800 text-right font-medium whitespace-nowrap">{fmtEur(inv.total_amount)}</td>
                      <td className="px-4 py-2.5 text-center">
                        {inv.tax_bonus && inv.tax_bonus !== 'none' ? (
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs border font-medium ${BONUS_COLORS[inv.tax_bonus]}`}>
                            {inv.tax_bonus === 'ristrutturazione' ? 'Ristr.' : inv.tax_bonus === 'ecobonus' ? 'Eco' : inv.tax_bonus === 'sismabonus' ? 'Sisma' : 'Mobili'}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="text-xs text-stone-400 hover:text-red-600 transition-colors"
                          title="Delete invoice"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !showForm && (
              <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
                <p className="text-sm text-stone-500">No invoices recorded yet.</p>
              </div>
            )
          )}
        </div>

        {/* Right: tax summary */}
        <div className="space-y-5">
          <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stone-700">Tax Deduction Summary</h3>
            <BonusBar label="Ristrutturazione" spent={tracker?.ristrutturazione_spent ?? 0} cap={tracker?.ristrutturazione_cap ?? 96000} />
            <BonusBar label="Ecobonus" spent={tracker?.ecobonus_spent ?? 0} cap={tracker?.ecobonus_cap ?? 60000} />
            <BonusBar label="Sismabonus" spent={tracker?.sismabonus_spent ?? 0} cap={tracker?.sismabonus_cap ?? 96000} />
            <BonusBar label="Bonus Mobili" spent={tracker?.mobili_spent ?? 0} cap={tracker?.mobili_cap ?? 5000} />
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700">Totals</h3>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Total spent</span>
              <span className="font-semibold text-stone-900">{fmtEur(totalSpent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Tax-deductible</span>
              <span className="font-semibold text-emerald-700">{fmtEur(totalDeductible)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-stone-100 pt-2">
              <span className="text-stone-500">Annual deduction (10yr)</span>
              <span className="font-semibold text-stone-900">{fmtEur(Math.round(totalDeductible * 0.5 / 10))}/yr</span>
            </div>
            <p className="text-xs text-stone-400">{invoices.length} invoices recorded</p>
          </div>
        </div>
      </div>
    </section>
  );
}
