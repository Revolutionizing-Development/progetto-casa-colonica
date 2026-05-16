export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  title_it: string;
  description: string;
  phase: 'pre_purchase' | 'purchase' | 'renovation' | 'pre_opening' | 'ongoing';
  priority: 'critical' | 'important' | 'recommended';
  regulatory: boolean;
  deadline_note?: string;
}

export const OPERATIONAL_CHECKLISTS: ChecklistItem[] = [
  // Pre-purchase
  { id: 'pre-01', category: 'Legal', title: 'Verify property title (visura catastale)', title_it: 'Verifica titolo di proprietà (visura catastale)', description: 'Obtain and verify visura catastale from Agenzia delle Entrate to confirm ownership, liens, and encumbrances.', phase: 'pre_purchase', priority: 'critical', regulatory: true },
  { id: 'pre-02', category: 'Legal', title: 'Check urban planning compliance (certificato di destinazione urbanistica)', title_it: 'Verifica conformità urbanistica (CDU)', description: 'Request CDU from Comune to verify land zoning matches intended agricultural/residential use.', phase: 'pre_purchase', priority: 'critical', regulatory: true },
  { id: 'pre-03', category: 'Legal', title: 'Verify building permits history (titoli edilizi)', title_it: 'Verifica storico titoli edilizi', description: 'Check all past building permits and confirm no abusivismo (unauthorized construction).', phase: 'pre_purchase', priority: 'critical', regulatory: true },
  { id: 'pre-04', category: 'Technical', title: 'Commission structural survey', title_it: 'Perizia strutturale', description: 'Hire geometra/ingegnere for structural assessment including seismic risk classification.', phase: 'pre_purchase', priority: 'critical', regulatory: false },
  { id: 'pre-05', category: 'Technical', title: 'Check water and sewage connections', title_it: 'Verifica allacciamenti idrico-fognari', description: 'Verify public water supply, well permits if applicable, and wastewater treatment (fossa biologica or allaccio fognatura).', phase: 'pre_purchase', priority: 'important', regulatory: true },
  { id: 'pre-06', category: 'Technical', title: 'Verify electrical capacity and gas supply', title_it: 'Verifica capacità elettrica e gas', description: 'Check ENEL connection capacity (typically 3-6kW residential) and gas availability (bombolone or metano).', phase: 'pre_purchase', priority: 'important', regulatory: false },
  { id: 'pre-07', category: 'Financial', title: 'Obtain codice fiscale', title_it: 'Ottenere codice fiscale', description: 'Apply at Agenzia delle Entrate or Italian consulate. Required for all transactions.', phase: 'pre_purchase', priority: 'critical', regulatory: true },
  { id: 'pre-08', category: 'Financial', title: 'Open Italian bank account', title_it: 'Apertura conto corrente italiano', description: 'Required for bonifico parlante payments and receiving rental income.', phase: 'pre_purchase', priority: 'critical', regulatory: false },

  // Purchase
  { id: 'purch-01', category: 'Legal', title: 'Sign preliminary contract (compromesso)', title_it: 'Firma del compromesso', description: 'Sign preliminary sale agreement with deposit (caparra confirmatoria, typically 10-20%).', phase: 'purchase', priority: 'critical', regulatory: true },
  { id: 'purch-02', category: 'Legal', title: 'Complete notarial deed (rogito)', title_it: 'Atto notarile (rogito)', description: 'Final transfer at notaio. Bring valid ID, codice fiscale, bank details.', phase: 'purchase', priority: 'critical', regulatory: true },
  { id: 'purch-03', category: 'Financial', title: 'Pay registration tax and fees', title_it: 'Pagamento imposta di registro e oneri', description: 'Pay imposta di registro (2% primary / 9% second home on cadastral value), imposta ipotecaria €50, imposta catastale €50.', phase: 'purchase', priority: 'critical', regulatory: true },
  { id: 'purch-04', category: 'Admin', title: 'Register residency if primary home', title_it: 'Iscrizione anagrafica (se prima casa)', description: 'Register residency within 18 months to maintain prima casa tax benefits.', phase: 'purchase', priority: 'critical', regulatory: true, deadline_note: 'Within 18 months of purchase' },
  { id: 'purch-05', category: 'Admin', title: 'Transfer utilities (voltura)', title_it: 'Voltura utenze', description: 'Transfer electricity (ENEL), gas, and water contracts to your name.', phase: 'purchase', priority: 'important', regulatory: false },

  // Renovation
  { id: 'ren-01', category: 'Permits', title: 'File CILA/SCIA with Comune', title_it: 'Presentazione CILA/SCIA al Comune', description: 'CILA for non-structural work, SCIA for structural modifications. Required before starting work.', phase: 'renovation', priority: 'critical', regulatory: true },
  { id: 'ren-02', category: 'Permits', title: 'Appoint project director (direttore lavori)', title_it: 'Nomina direttore lavori', description: 'Licensed architect/engineer required for SCIA works to supervise and certify completion.', phase: 'renovation', priority: 'critical', regulatory: true },
  { id: 'ren-03', category: 'Compliance', title: 'Ensure guest apartment separation', title_it: 'Separazione alloggi ospiti', description: 'Independent entrances, no sightlines between guest and owner areas per Constitution N10.', phase: 'renovation', priority: 'critical', regulatory: false },
  { id: 'ren-04', category: 'Tax', title: 'Set up bonifico parlante payments', title_it: 'Impostare bonifici parlanti', description: 'Configure bank transfers with correct causale for tax deductions. Include law reference, invoice details, CF and P.IVA.', phase: 'renovation', priority: 'critical', regulatory: true },
  { id: 'ren-05', category: 'Tax', title: 'Track invoices per bonus category', title_it: 'Tracciamento fatture per categoria bonus', description: 'Separate invoices by ristrutturazione, ecobonus, sismabonus, mobili. Monitor cap usage.', phase: 'renovation', priority: 'important', regulatory: true },
  { id: 'ren-06', category: 'Tax', title: 'File ENEA declaration for energy work', title_it: 'Comunicazione ENEA per lavori energetici', description: 'Submit within 90 days of energy work completion. Required for ecobonus deduction.', phase: 'renovation', priority: 'critical', regulatory: true, deadline_note: '90 days after energy work completion' },
  { id: 'ren-07', category: 'Safety', title: 'Obtain safety coordinator (CSP/CSE)', title_it: 'Nomina coordinatore sicurezza (CSP/CSE)', description: 'Required when multiple contractors work simultaneously on site (D.Lgs 81/2008).', phase: 'renovation', priority: 'important', regulatory: true },

  // Pre-opening
  { id: 'open-01', category: 'Regulatory', title: 'File SCIA for agriturismo/B&B', title_it: 'Presentazione SCIA per agriturismo/B&B', description: 'File hospitality SCIA with Comune. Requirements vary by region.', phase: 'pre_opening', priority: 'critical', regulatory: true },
  { id: 'open-02', category: 'Regulatory', title: 'Obtain fire safety certificate (SCIA antincendio)', title_it: 'SCIA antincendio VVF', description: 'Required for structures >25 beds or >400m². File with Vigili del Fuoco.', phase: 'pre_opening', priority: 'critical', regulatory: true },
  { id: 'open-03', category: 'Regulatory', title: 'Register with tourism portal (Alloggiati Web)', title_it: 'Registrazione Alloggiati Web', description: 'Legal requirement to report guest identities to Questura within 24h of check-in.', phase: 'pre_opening', priority: 'critical', regulatory: true },
  { id: 'open-04', category: 'Tax', title: 'Register for tourist tax collection (imposta di soggiorno)', title_it: 'Registrazione imposta di soggiorno', description: 'Register with Comune to collect and remit tourist tax. Rates vary by municipality.', phase: 'pre_opening', priority: 'critical', regulatory: true },
  { id: 'open-05', category: 'Tax', title: 'Choose tax regime (cedolare secca)', title_it: 'Scelta regime fiscale (cedolare secca)', description: 'Opt for cedolare secca 21% (≤4 units) or 26% (5+ units from 2024) vs progressive IRPEF.', phase: 'pre_opening', priority: 'important', regulatory: true },
  { id: 'open-06', category: 'Insurance', title: 'Obtain hospitality liability insurance', title_it: 'Assicurazione RC per ospitalità', description: 'Liability coverage for guests. Most platforms require proof of insurance.', phase: 'pre_opening', priority: 'critical', regulatory: false },
  { id: 'open-07', category: 'Operations', title: 'Set up no-smoking policy signage', title_it: 'Segnaletica divieto di fumo', description: 'No smoking anywhere on property per Constitution N11. Include in all listings.', phase: 'pre_opening', priority: 'important', regulatory: false },
  { id: 'open-08', category: 'Operations', title: 'Create guest welcome guide (bilingual)', title_it: 'Guida di benvenuto bilingue', description: 'House rules, emergency contacts, local info, WiFi, waste separation guide. EN + IT.', phase: 'pre_opening', priority: 'recommended', regulatory: false },

  // Ongoing
  { id: 'ong-01', category: 'Tax', title: 'File annual tax declaration (Modello Redditi/730)', title_it: 'Dichiarazione dei redditi annuale', description: 'Include rental income, tax deductions, and cedolare secca. Deadline: November 30.', phase: 'ongoing', priority: 'critical', regulatory: true, deadline_note: 'Annual — November 30' },
  { id: 'ong-02', category: 'Tax', title: 'Pay IMU (property tax)', title_it: 'Pagamento IMU', description: 'Due in two installments: June 16 (acconto) and December 16 (saldo). Exempt for primary residence (non-luxury).', phase: 'ongoing', priority: 'critical', regulatory: true, deadline_note: 'June 16 + December 16' },
  { id: 'ong-03', category: 'Tax', title: 'Pay TARI (waste tax)', title_it: 'Pagamento TARI', description: 'Annual waste collection tax. Paid to Comune, usually in 3-4 installments.', phase: 'ongoing', priority: 'important', regulatory: true },
  { id: 'ong-04', category: 'Compliance', title: 'Report guests to Questura (Alloggiati Web)', title_it: 'Comunicazione ospiti alla Questura', description: 'Submit guest identity documents within 24 hours of check-in. €206 fine per violation.', phase: 'ongoing', priority: 'critical', regulatory: true },
  { id: 'ong-05', category: 'Compliance', title: 'Collect and remit tourist tax', title_it: 'Riscossione e versamento imposta di soggiorno', description: 'Collect from guests at checkout, remit to Comune per schedule. Keep records.', phase: 'ongoing', priority: 'critical', regulatory: true },
  { id: 'ong-06', category: 'Maintenance', title: 'Annual boiler servicing + emissions test', title_it: 'Revisione caldaia + controllo fumi', description: 'Mandatory annual maintenance. Keep libretto di impianto updated.', phase: 'ongoing', priority: 'important', regulatory: true, deadline_note: 'Annual' },
  { id: 'ong-07', category: 'Maintenance', title: 'Fire extinguisher inspection', title_it: 'Revisione estintori', description: 'Six-monthly visual check, annual maintenance, five-year revision.', phase: 'ongoing', priority: 'important', regulatory: true, deadline_note: '6 months / annual / 5 years' },
  { id: 'ong-08', category: 'Insurance', title: 'Renew property and liability insurance', title_it: 'Rinnovo assicurazione immobili e RC', description: 'Annual renewal. Review coverage after any structural changes.', phase: 'ongoing', priority: 'important', regulatory: false, deadline_note: 'Annual' },
];

export const PHASE_LABELS: Record<string, string> = {
  pre_purchase: 'Pre-Purchase',
  purchase: 'Purchase & Closing',
  renovation: 'Renovation',
  pre_opening: 'Pre-Opening',
  ongoing: 'Ongoing Operations',
};

export const PHASE_ORDER = ['pre_purchase', 'purchase', 'renovation', 'pre_opening', 'ongoing'] as const;
