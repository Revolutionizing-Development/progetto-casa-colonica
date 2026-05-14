export type TaxBonus = 'ristrutturazione' | 'ecobonus' | 'sismabonus' | 'mobili' | 'none';

export type PaymentMethod = 'bonifico_parlante' | 'credit_card' | 'cash' | 'regular_transfer';

export interface Invoice {
  id: string;
  property_id: string;
  scenario_id?: string;
  user_id: string;
  vendor_name: string;
  vendor_partita_iva?: string;
  invoice_number?: string;
  invoice_date?: string;
  amount_excl_iva: number;
  iva_rate?: number;
  iva_amount?: number;
  total_amount: number;
  description?: string;
  original_photo_url?: string;
  phase_number?: number;
  line_item_key?: string;
  is_diy_materials: boolean;
  tax_bonus?: TaxBonus;
  payment_method: PaymentMethod;
  is_tax_deductible: boolean;
  bonifico_text?: string;
  payment_confirmed: boolean;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxDeductionTracker {
  id: string;
  property_id: string;
  user_id: string;
  is_primary_residence: boolean;
  ristrutturazione_rate: number;
  ecobonus_rate: number;
  sismabonus_rate: number;
  ristrutturazione_cap: number;
  ristrutturazione_spent: number;
  ecobonus_cap: number;
  ecobonus_spent: number;
  sismabonus_cap: number;
  sismabonus_spent: number;
  mobili_cap: number;
  mobili_spent: number;
  enea_work_completed_date?: string;
  enea_filing_deadline?: string;
  enea_filed: boolean;
  enea_filed_date?: string;
  codice_fiscale?: string;
  created_at: string;
  updated_at: string;
}

export interface DIYSaving {
  id: string;
  property_id: string;
  scenario_id?: string;
  user_id: string;
  phase_number?: number;
  line_item_key: string;
  description: string;
  contractor_estimate: number;
  materials_actual: number;
  savings_amount: number;
  materials_deductible: boolean;
  notes?: string;
  created_at: string;
}

export interface DeductionScheduleRow {
  bonus: TaxBonus;
  total_eligible_spend: number;
  annual_deduction: number;
  years: number[];
  year_amounts: Record<number, number>;
}

export interface BonificoData {
  invoice_no: string;
  invoice_date: string;
  description: string;
  codice_fiscale: string;
  partita_iva: string;
  bonus_type: TaxBonus;
  generated_text: string;
}
