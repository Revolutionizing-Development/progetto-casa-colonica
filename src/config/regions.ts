export const ITALIAN_REGIONS = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino-Alto Adige',
  'Umbria',
  "Valle d'Aosta",
  'Veneto',
] as const;

export type ItalianRegion = (typeof ITALIAN_REGIONS)[number];

/** Seismic zone by region (simplified — use commune-level data for accuracy) */
export const REGION_SEISMIC_ZONES: Record<ItalianRegion, '1' | '2' | '3' | '4'> = {
  'Abruzzo': '1',
  'Basilicata': '1',
  'Calabria': '1',
  'Campania': '1',
  'Emilia-Romagna': '2',
  'Friuli-Venezia Giulia': '2',
  'Lazio': '2',
  'Liguria': '3',
  'Lombardia': '3',
  'Marche': '2',
  'Molise': '1',
  'Piemonte': '3',
  'Puglia': '2',
  'Sardegna': '4',
  'Sicilia': '1',
  'Toscana': '2',
  'Trentino-Alto Adige': '2',
  'Umbria': '2',
  "Valle d'Aosta": '3',
  'Veneto': '3',
};

/** Regions with significant wild boar presence */
export const BOAR_RISK_REGIONS: ItalianRegion[] = [
  'Toscana',
  'Umbria',
  'Lazio',
  'Marche',
  'Abruzzo',
];
