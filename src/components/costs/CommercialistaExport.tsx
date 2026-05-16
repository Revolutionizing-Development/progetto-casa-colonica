'use client';

import { useMemo, useCallback } from 'react';
import { buildCommercialistaData, toCSV } from '@/lib/commercialista-export';
import type { CommerciaalistaData } from '@/lib/commercialista-export';
import type { Invoice, TaxDeductionTracker } from '@/types/invoice';

function fmtEur(n: number) { return `€${n.toLocaleString('en-US')}`; }

interface Props {
  propertyName: string;
  propertyAddress: string;
  invoices: Invoice[];
  tracker: TaxDeductionTracker | null;
}

export default function CommercialistaExport({ propertyName, propertyAddress, invoices, tracker }: Props) {
  const data = useMemo(
    () => buildCommercialistaData(propertyName, propertyAddress, invoices, tracker),
    [propertyName, propertyAddress, invoices, tracker],
  );

  const handleCSVDownload = useCallback(() => {
    const csv = toCSV(data);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commercialista-${propertyName.toLowerCase().replace(/\s+/g, '-')}-${data.exportDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, propertyName]);

  const deductibleInvoices = invoices.filter((inv) => inv.is_tax_deductible);

  if (deductibleInvoices.length === 0 && data.bonusSummaries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-10 text-center">
        <p className="text-stone-400 text-sm">No tax-deductible invoices to export. Record invoices with a tax bonus to generate a commercialista report.</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Commercialista Export</h3>
          <p className="text-sm text-stone-500 mt-1">
            Tax deduction summary for your accountant. Includes all deductible invoices, bonus tracking, and ENEA status.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCSVDownload}
            className="px-4 py-2 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-900 transition-colors"
          >
            Download CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      {/* Property info */}
      <div className="rounded-xl border border-stone-200 p-5 bg-stone-50 grid grid-cols-2 gap-4 text-sm print:bg-white">
        <InfoRow label="Immobile" value={propertyName} />
        <InfoRow label="Indirizzo" value={propertyAddress || '—'} />
        <InfoRow label="Codice Fiscale" value={data.codiceFiscale || 'Non impostato'} />
        <InfoRow label="Abitazione" value={data.isPrimaryResidence ? 'Principale' : 'Seconda casa'} />
        <InfoRow label="Data export" value={data.exportDate} />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <TotalCard label="Totale speso" value={fmtEur(data.totalSpent)} />
        <TotalCard label="Totale detraibile" value={fmtEur(data.totalDeductible)} highlight />
        <TotalCard label="Detrazione annuale" value={`${fmtEur(data.totalAnnualDeduction)}/anno`} sub="per 10 anni" highlight />
      </div>

      {/* Bonus breakdown */}
      {data.bonusSummaries.length > 0 && (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3 bg-stone-50 border-b border-stone-200">
            <h4 className="text-sm font-semibold text-stone-700">Riepilogo Bonus Fiscali</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-5 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Bonus</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Rif. normativo</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Aliquota</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Speso</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Tetto</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Residuo</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Detraz. annuale</th>
                </tr>
              </thead>
              <tbody>
                {data.bonusSummaries.map((b) => (
                  <tr key={b.bonus} className="border-b border-stone-100 last:border-0">
                    <td className="px-5 py-2.5 font-medium text-stone-700">{b.name}</td>
                    <td className="px-4 py-2.5 text-stone-500">{b.legal_ref}</td>
                    <td className="px-4 py-2.5 text-right text-stone-600">{(b.rate * 100).toFixed(0)}%</td>
                    <td className="px-4 py-2.5 text-right text-stone-900 font-medium">{fmtEur(b.spent)}</td>
                    <td className="px-4 py-2.5 text-right text-stone-600">{fmtEur(b.cap)}</td>
                    <td className="px-4 py-2.5 text-right text-stone-600">{fmtEur(b.remaining)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700 font-medium">{fmtEur(b.annual_deduction)}/anno</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ENEA warning */}
      {data.eneaRequired && (
        <div className={`rounded-xl border p-4 ${data.eneaFiled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            <span className="text-lg">{data.eneaFiled ? '✓' : '⚠'}</span>
            <div>
              <p className={`text-sm font-medium ${data.eneaFiled ? 'text-emerald-800' : 'text-amber-800'}`}>
                {data.eneaFiled
                  ? 'Comunicazione ENEA presentata'
                  : 'Comunicazione ENEA richiesta'}
              </p>
              <p className={`text-xs mt-0.5 ${data.eneaFiled ? 'text-emerald-600' : 'text-amber-600'}`}>
                {data.eneaFiled
                  ? 'Ecobonus: dichiarazione ENEA inviata.'
                  : `Ecobonus: obbligo di comunicazione ENEA entro 90 giorni dalla fine dei lavori energetici.${data.eneaDeadline ? ` Scadenza: ${data.eneaDeadline}.` : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deductible invoices list */}
      <div className="rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200">
          <h4 className="text-sm font-semibold text-stone-700">
            Fatture detraibili ({deductibleInvoices.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Data</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">N. Fatt.</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Fornitore</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">P.IVA</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Descrizione</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Totale</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Bonus</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {deductibleInvoices
                .sort((a, b) => (a.invoice_date ?? '').localeCompare(b.invoice_date ?? ''))
                .map((inv) => (
                  <tr key={inv.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-5 py-2.5 text-stone-600 whitespace-nowrap">{inv.invoice_date ?? '—'}</td>
                    <td className="px-4 py-2.5 text-stone-600">{inv.invoice_number ?? '—'}</td>
                    <td className="px-4 py-2.5 text-stone-700 font-medium">{inv.vendor_name}</td>
                    <td className="px-4 py-2.5 text-stone-500 font-mono text-xs">{inv.vendor_partita_iva ?? '—'}</td>
                    <td className="px-4 py-2.5 text-stone-600 max-w-[200px] truncate">{inv.description}</td>
                    <td className="px-4 py-2.5 text-right text-stone-900 font-medium">{fmtEur(inv.total_amount)}</td>
                    <td className="px-4 py-2.5 text-stone-600 text-xs">{inv.tax_bonus ?? '—'}</td>
                    <td className="px-4 py-2.5 text-stone-500 text-xs">{inv.payment_method.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-stone-400 print:hidden">
        This export is a convenience tool — verify all data with your commercialista before filing.
      </p>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-stone-400">{label}</span>
      <p className="text-stone-700 font-medium">{value}</p>
    </div>
  );
}

function TotalCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'}`}>
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-emerald-800' : 'text-stone-900'}`}>{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}
