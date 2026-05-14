/**
 * Italian tax bonus rules for 2026.
 * All monetary values in euros (integers).
 * Deduction period is always 10 years.
 */
export const TAX_BONUSES = {
  ristrutturazione: {
    name: 'Bonus Ristrutturazione',
    name_it: 'Bonus Ristrutturazione Edilizia',
    legal_ref: 'art. 16-bis DPR 917/1986',
    rate_primary: 0.50,
    rate_second_home: 0.36,
    cap_euros: 96000,
    deduction_years: 10,
    payment_required: 'bonifico_parlante',
    auto_categories: [
      'roof', 'structural', 'walls', 'floors', 'doors', 'windows_structural',
      'plumbing', 'electrical', 'general_renovation', 'diy_materials',
    ],
  },
  ecobonus: {
    name: 'Ecobonus',
    name_it: 'Detrazioni per Risparmio Energetico',
    legal_ref: 'art. 14 DL 63/2013',
    rate_primary: 0.50,
    rate_second_home: 0.36,
    cap_euros_insulation: 60000,
    cap_euros_windows: 60000,
    cap_euros_heat_pump: 30000,
    cap_euros_solar: 48000,
    deduction_years: 10,
    enea_filing_days: 90,
    payment_required: 'bonifico_parlante',
    auto_categories: [
      'insulation', 'heat_pump', 'windows_thermal', 'solar_panels',
      'boiler_condensing', 'energy_audit',
    ],
  },
  sismabonus: {
    name: 'Sismabonus',
    name_it: 'Detrazione per Miglioramento Sismico',
    legal_ref: 'art. 16 DL 63/2013',
    rate_primary: 0.50,
    rate_second_home: 0.36,
    cap_euros: 96000,
    deduction_years: 10,
    applies_zones: ['1', '2', '3'],
    payment_required: 'bonifico_parlante',
    auto_categories: ['seismic_reinforcement', 'structural_seismic'],
  },
  mobili: {
    name: 'Bonus Mobili',
    name_it: 'Detrazione per Arredo',
    legal_ref: 'art. 16 co. 2 DL 63/2013',
    rate_primary: 0.50,
    rate_second_home: null,
    cap_euros: 5000,
    deduction_years: 10,
    requires_ristrutturazione: true,
    payment_required: 'bonifico_parlante_or_credit_card',
    auto_categories: ['furniture', 'appliances_a_class', 'kitchen'],
  },
} as const;

export type TaxBonusKey = keyof typeof TAX_BONUSES;

export const BONIFICO_TEMPLATES: Record<'ristrutturazione' | 'ecobonus' | 'sismabonus', string> = {
  ristrutturazione:
    'Ristrutturazione art. 16-bis DPR 917/1986 – Fatt. n. {INVOICE_NO} del {DATE} – {DESC} – CF: {CODICE_FISCALE} – P.IVA: {PARTITA_IVA}',
  ecobonus:
    'Risparmio energetico art. 14 DL 63/2013 – Fatt. n. {INVOICE_NO} del {DATE} – {DESC} – CF: {CODICE_FISCALE} – P.IVA: {PARTITA_IVA}',
  sismabonus:
    'Adeguamento sismico art. 16 DL 63/2013 – Fatt. n. {INVOICE_NO} del {DATE} – {DESC} – CF: {CODICE_FISCALE} – P.IVA: {PARTITA_IVA}',
};
