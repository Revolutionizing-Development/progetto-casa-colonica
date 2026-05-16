import type { Invoice, TaxDeductionTracker, TaxBonus } from '@/types/invoice';
import { TAX_BONUSES, type TaxBonusKey } from '@/config/tax-bonuses';

interface ExportRow {
  invoice_date: string;
  invoice_number: string;
  vendor_name: string;
  vendor_partita_iva: string;
  description: string;
  amount_excl_iva: number;
  iva_rate: number;
  iva_amount: number;
  total_amount: number;
  payment_method: string;
  tax_bonus: string;
  is_tax_deductible: boolean;
  bonifico_text: string;
}

interface BonusSummary {
  bonus: TaxBonus;
  name: string;
  legal_ref: string;
  rate: number;
  cap: number;
  spent: number;
  remaining: number;
  annual_deduction: number;
  deduction_years: number;
}

export interface CommerciaalistaData {
  propertyName: string;
  propertyAddress: string;
  codiceFiscale: string;
  isPrimaryResidence: boolean;
  invoiceRows: ExportRow[];
  bonusSummaries: BonusSummary[];
  totalSpent: number;
  totalDeductible: number;
  totalAnnualDeduction: number;
  eneaRequired: boolean;
  eneaFiled: boolean;
  eneaDeadline: string | null;
  exportDate: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  bonifico_parlante: 'Bonifico parlante',
  credit_card: 'Carta di credito',
  regular_transfer: 'Bonifico ordinario',
  cash: 'Contanti',
};

const BONUS_LABELS: Record<string, string> = {
  ristrutturazione: 'Ristrutturazione',
  ecobonus: 'Ecobonus',
  sismabonus: 'Sismabonus',
  mobili: 'Bonus Mobili',
  none: 'Nessuno',
};

export function buildCommercialistaData(
  propertyName: string,
  propertyAddress: string,
  invoices: Invoice[],
  tracker: TaxDeductionTracker | null,
): CommerciaalistaData {
  const isPrimary = tracker?.is_primary_residence ?? false;
  const cf = tracker?.codice_fiscale ?? '';

  const invoiceRows: ExportRow[] = invoices
    .sort((a, b) => (a.invoice_date ?? '').localeCompare(b.invoice_date ?? ''))
    .map((inv) => ({
      invoice_date: inv.invoice_date ?? '',
      invoice_number: inv.invoice_number ?? '',
      vendor_name: inv.vendor_name,
      vendor_partita_iva: inv.vendor_partita_iva ?? '',
      description: inv.description ?? '',
      amount_excl_iva: inv.amount_excl_iva,
      iva_rate: inv.iva_rate ?? 22,
      iva_amount: inv.iva_amount ?? 0,
      total_amount: inv.total_amount,
      payment_method: PAYMENT_LABELS[inv.payment_method] ?? inv.payment_method,
      tax_bonus: BONUS_LABELS[inv.tax_bonus ?? 'none'] ?? 'Nessuno',
      is_tax_deductible: inv.is_tax_deductible,
      bonifico_text: inv.bonifico_text ?? '',
    }));

  const bonuses: Array<{ key: TaxBonusKey; spent: number; cap: number; rate: number }> = [
    {
      key: 'ristrutturazione',
      spent: tracker?.ristrutturazione_spent ?? 0,
      cap: tracker?.ristrutturazione_cap ?? TAX_BONUSES.ristrutturazione.cap_euros,
      rate: tracker?.ristrutturazione_rate ?? (isPrimary ? 0.50 : 0.36),
    },
    {
      key: 'ecobonus',
      spent: tracker?.ecobonus_spent ?? 0,
      cap: tracker?.ecobonus_cap ?? TAX_BONUSES.ecobonus.cap_euros_insulation,
      rate: tracker?.ecobonus_rate ?? (isPrimary ? 0.50 : 0.36),
    },
    {
      key: 'sismabonus',
      spent: tracker?.sismabonus_spent ?? 0,
      cap: tracker?.sismabonus_cap ?? TAX_BONUSES.sismabonus.cap_euros,
      rate: tracker?.sismabonus_rate ?? (isPrimary ? 0.50 : 0.36),
    },
    {
      key: 'mobili',
      spent: tracker?.mobili_spent ?? 0,
      cap: tracker?.mobili_cap ?? TAX_BONUSES.mobili.cap_euros,
      rate: 0.50,
    },
  ];

  const bonusSummaries: BonusSummary[] = bonuses
    .filter((b) => b.spent > 0)
    .map((b) => {
      const eligible = Math.min(b.spent, b.cap);
      const totalDeduction = Math.round(eligible * b.rate);
      return {
        bonus: b.key,
        name: TAX_BONUSES[b.key].name_it,
        legal_ref: TAX_BONUSES[b.key].legal_ref,
        rate: b.rate,
        cap: b.cap,
        spent: b.spent,
        remaining: Math.max(0, b.cap - b.spent),
        annual_deduction: Math.round(totalDeduction / 10),
        deduction_years: 10,
      };
    });

  const totalSpent = invoices.reduce((s, inv) => s + inv.total_amount, 0);
  const totalDeductible = invoices.filter((inv) => inv.is_tax_deductible).reduce((s, inv) => s + inv.total_amount, 0);
  const totalAnnualDeduction = bonusSummaries.reduce((s, b) => s + b.annual_deduction, 0);

  const hasEcobonus = invoices.some((inv) => inv.tax_bonus === 'ecobonus' && inv.is_tax_deductible);

  return {
    propertyName,
    propertyAddress,
    codiceFiscale: cf,
    isPrimaryResidence: isPrimary,
    invoiceRows,
    bonusSummaries,
    totalSpent,
    totalDeductible,
    totalAnnualDeduction,
    eneaRequired: hasEcobonus,
    eneaFiled: tracker?.enea_filed ?? false,
    eneaDeadline: tracker?.enea_filing_deadline ?? null,
    exportDate: new Date().toISOString().split('T')[0],
  };
}

export function toCSV(data: CommerciaalistaData): string {
  const headers = [
    'Data Fattura', 'N. Fattura', 'Fornitore', 'P.IVA Fornitore',
    'Descrizione', 'Imponibile', 'Aliquota IVA', 'IVA', 'Totale',
    'Metodo Pagamento', 'Bonus Fiscale', 'Detraibile', 'Testo Bonifico',
  ];

  const escape = (v: string | number | boolean) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = data.invoiceRows.map((r) => [
    r.invoice_date, r.invoice_number, r.vendor_name, r.vendor_partita_iva,
    r.description, r.amount_excl_iva, `${r.iva_rate}%`, r.iva_amount, r.total_amount,
    r.payment_method, r.tax_bonus, r.is_tax_deductible ? 'Sì' : 'No', r.bonifico_text,
  ].map(escape).join(','));

  const summaryHeader = '\n\nRIEPILOGO BONUS FISCALI';
  const summaryRows = data.bonusSummaries.map((b) =>
    `${b.name},${b.legal_ref},${(b.rate * 100).toFixed(0)}%,${b.cap},${b.spent},${b.remaining},${b.annual_deduction}/anno x ${b.deduction_years} anni`
  );

  const meta = [
    `\nImmobile: ${data.propertyName}`,
    `Indirizzo: ${data.propertyAddress}`,
    `Codice Fiscale: ${data.codiceFiscale}`,
    `Abitazione principale: ${data.isPrimaryResidence ? 'Sì' : 'No'}`,
    `Totale speso: €${data.totalSpent.toLocaleString('it-IT')}`,
    `Totale detraibile: €${data.totalDeductible.toLocaleString('it-IT')}`,
    `Detrazione annuale: €${data.totalAnnualDeduction.toLocaleString('it-IT')}/anno`,
    data.eneaRequired ? `ENEA: ${data.eneaFiled ? 'Presentata' : `DA PRESENTARE${data.eneaDeadline ? ` entro ${data.eneaDeadline}` : ''}`}` : '',
    `Data export: ${data.exportDate}`,
  ].filter(Boolean);

  return [headers.join(','), ...rows, summaryHeader, ...summaryRows, ...meta].join('\n');
}
