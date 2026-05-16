import type { TaxBonusKey } from './tax-bonuses';

export type UnitType = 'sqm' | 'unit' | 'lin_m' | 'kw' | 'kwh' | 'hectare' | 'year' | 'month' | 'forfait' | 'pct';

export type CostSource = 'ai' | 'manual' | 'energy_driven' | 'contractor_quote';

export type ItemCategory =
  | 'structural_envelope'
  | 'windows_doors'
  | 'systems'
  | 'interior_finishes'
  | 'guest_separation'
  | 'energy'
  | 'vehicles_equipment'
  | 'swimming_pool'
  | 'home_gym'
  | 'greenhouse_growing'
  | 'perimeter_security'
  | 'outdoor_hospitality'
  | 'livestock'
  | 'site_work'
  | 'transition_setup'
  | 'professional_fees'
  | 'operating';

export interface CostLineItem {
  key: string;
  description: string;
  description_it: string;
  category: ItemCategory;
  unitType: UnitType;
  unitCost: number;
  diyLaborPercent: number;
  isRegulated: boolean;
  taxBonus: TaxBonusKey | 'none';
  toggleable: boolean;
  toggleGroup?: string;
  radioGroup?: string;
  isOngoing: boolean;
}

export type RegionalMultiplierKey =
  | 'tuscany_chianti'
  | 'tuscany_south'
  | 'umbria'
  | 'lazio_north'
  | 'marche';

export const REGIONAL_MULTIPLIERS: Record<RegionalMultiplierKey, { label: string; multiplier: number }> = {
  tuscany_chianti: { label: 'Tuscany (Chianti/Florence)', multiplier: 1.25 },
  tuscany_south:   { label: 'Tuscany (southern/Maremma)', multiplier: 1.05 },
  umbria:          { label: 'Umbria', multiplier: 1.00 },
  lazio_north:     { label: 'Lazio (northern)', multiplier: 0.92 },
  marche:          { label: 'Marche', multiplier: 0.88 },
};

export const COST_LINE_ITEMS: CostLineItem[] = [
  // ─── Structural & Envelope ────────────────────────────────────────────
  { key: 'roof_cotto_retile',      description: 'Roof cotto retile',                   description_it: 'Rifacimento tetto in cotto',           category: 'structural_envelope', unitType: 'sqm',   unitCost: 110,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'roof_timber_replace',    description: 'Roof timber structure replacement',    description_it: 'Sostituzione struttura tetto in legno', category: 'structural_envelope', unitType: 'lin_m', unitCost: 400,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'roof_insulation',        description: 'Roof insulation',                      description_it: 'Isolamento tetto',                     category: 'structural_envelope', unitType: 'sqm',   unitCost: 50,    diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'walls_repointing',       description: 'Stone walls repointing',               description_it: 'Ristilatura muri in pietra',           category: 'structural_envelope', unitType: 'sqm',   unitCost: 130,   diyLaborPercent: 50,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'walls_plaster_restore',  description: 'Walls plaster restore',                description_it: 'Ripristino intonaco',                  category: 'structural_envelope', unitType: 'sqm',   unitCost: 55,    diyLaborPercent: 30,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'walls_insulation',       description: 'Walls insulation',                     description_it: 'Isolamento pareti',                    category: 'structural_envelope', unitType: 'sqm',   unitCost: 85,    diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'seismic_reinforcement',  description: 'Seismic reinforcement',                description_it: 'Adeguamento sismico',                  category: 'structural_envelope', unitType: 'sqm',   unitCost: 180,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'sismabonus',       toggleable: false, isOngoing: false },
  { key: 'structural_beam',        description: 'Structural beam replacement',          description_it: 'Sostituzione travi portanti',          category: 'structural_envelope', unitType: 'lin_m', unitCost: 380,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'arch_repair',            description: 'Arch repair',                          description_it: 'Riparazione archi',                    category: 'structural_envelope', unitType: 'unit',  unitCost: 2500,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'foundation_repair',      description: 'Foundation repair',                    description_it: 'Riparazione fondazioni',               category: 'structural_envelope', unitType: 'lin_m', unitCost: 300,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'damp_treatment',         description: 'Damp treatment',                       description_it: 'Trattamento umidità',                  category: 'structural_envelope', unitType: 'sqm',   unitCost: 90,    diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'demolition',             description: 'Demolition & clearing',                description_it: 'Demolizione e sgombero',               category: 'structural_envelope', unitType: 'sqm',   unitCost: 25,    diyLaborPercent: 90,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'scaffolding',            description: 'Scaffolding',                          description_it: 'Ponteggio',                            category: 'structural_envelope', unitType: 'sqm',   unitCost: 12,    diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },

  // ─── Windows & Doors ──────────────────────────────────────────────────
  { key: 'window_double_glazed',   description: 'Wood double-glazed window',            description_it: 'Finestra in legno doppio vetro',       category: 'windows_doors',       unitType: 'unit',    unitCost: 1200,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'window_heritage',        description: 'Heritage window',                      description_it: 'Finestra di pregio storico',           category: 'windows_doors',       unitType: 'unit',    unitCost: 1800,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'shutters',               description: 'Shutters',                             description_it: 'Persiane',                             category: 'windows_doors',       unitType: 'unit',    unitCost: 450,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'external_door',          description: 'External door',                        description_it: 'Porta esterna',                        category: 'windows_doors',       unitType: 'unit',    unitCost: 2500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'internal_door',          description: 'Internal door',                        description_it: 'Porta interna',                        category: 'windows_doors',       unitType: 'unit',    unitCost: 650,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'external_staircase',     description: 'External staircase',                   description_it: 'Scala esterna',                        category: 'windows_doors',       unitType: 'forfait', unitCost: 4500,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },

  // ─── Systems ──────────────────────────────────────────────────────────
  { key: 'electrical_full',        description: 'Electrical system (full)',              description_it: 'Impianto elettrico completo',          category: 'systems',             unitType: 'sqm',     unitCost: 65,    diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'plumbing_full',          description: 'Plumbing system (full)',                description_it: 'Impianto idraulico completo',          category: 'systems',             unitType: 'sqm',     unitCost: 80,    diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'bathroom_roughin',       description: 'Bathroom rough-in',                    description_it: 'Predisposizione bagno',                category: 'systems',             unitType: 'unit',    unitCost: 4500,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'heat_pump',              description: 'Heat pump system',                     description_it: 'Pompa di calore',                      category: 'systems',             unitType: 'forfait', unitCost: 14000, diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'underfloor_heating',     description: 'Underfloor heating',                   description_it: 'Riscaldamento a pavimento',            category: 'systems',             unitType: 'sqm',     unitCost: 75,    diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'radiators',              description: 'Radiators',                            description_it: 'Radiatori',                            category: 'systems',             unitType: 'unit',    unitCost: 450,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'solar_thermal',          description: 'Solar thermal',                        description_it: 'Solare termico',                       category: 'systems',             unitType: 'forfait', unitCost: 4000,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'septic_system',          description: 'Septic system',                        description_it: 'Fossa settica',                        category: 'systems',             unitType: 'forfait', unitCost: 8000,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'ventilation_mvhr',       description: 'Ventilation MVHR',                     description_it: 'Ventilazione meccanica VMC',           category: 'systems',             unitType: 'forfait', unitCost: 6000,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },

  // ─── Interior Finishes ────────────────────────────────────────────────
  { key: 'kitchen_custom',         description: 'Kitchen (custom)',                     description_it: 'Cucina su misura',                     category: 'interior_finishes',   unitType: 'forfait', unitCost: 18000, diyLaborPercent: 0,    isRegulated: false, taxBonus: 'mobili',           toggleable: false, isOngoing: false },
  { key: 'kitchen_airbnb',         description: 'Kitchen (Airbnb unit)',                description_it: 'Cucina per unità Airbnb',              category: 'interior_finishes',   unitType: 'forfait', unitCost: 8000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'mobili',           toggleable: false, isOngoing: false },
  { key: 'bathroom_full',          description: 'Bathroom (full fit-out)',              description_it: 'Bagno completo',                       category: 'interior_finishes',   unitType: 'unit',    unitCost: 10000, diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'ensuite',                description: 'Ensuite bathroom',                     description_it: 'Bagno en suite',                       category: 'interior_finishes',   unitType: 'unit',    unitCost: 7000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'flooring_cotto',         description: 'Flooring cotto tiles',                 description_it: 'Pavimento in cotto',                   category: 'interior_finishes',   unitType: 'sqm',     unitCost: 75,    diyLaborPercent: 40,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'flooring_oak',           description: 'Flooring oak',                         description_it: 'Pavimento in rovere',                  category: 'interior_finishes',   unitType: 'sqm',     unitCost: 85,    diyLaborPercent: 40,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'flooring_restore',       description: 'Flooring restoration (existing)',      description_it: 'Restauro pavimento esistente',         category: 'interior_finishes',   unitType: 'sqm',     unitCost: 100,   diyLaborPercent: 40,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'painting',               description: 'Painting',                             description_it: 'Tinteggiatura',                        category: 'interior_finishes',   unitType: 'sqm',     unitCost: 20,    diyLaborPercent: 85,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'plastering',             description: 'Plastering',                           description_it: 'Intonacatura',                         category: 'interior_finishes',   unitType: 'sqm',     unitCost: 45,    diyLaborPercent: 30,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'fireplace_restore',      description: 'Fireplace restoration',                description_it: 'Restauro camino',                      category: 'interior_finishes',   unitType: 'forfait', unitCost: 3000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'staircase_restore',      description: 'Staircase restoration',                description_it: 'Restauro scala',                       category: 'interior_finishes',   unitType: 'forfait', unitCost: 6000,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },

  // ─── Guest Separation (N10) ───────────────────────────────────────────
  { key: 'guest_entrance',         description: 'Independent guest entrance',           description_it: 'Ingresso indipendente ospiti',         category: 'guest_separation',    unitType: 'unit',    unitCost: 4500,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'soundproofing',          description: 'Soundproofing (min 60dB)',             description_it: 'Isolamento acustico (min 60dB)',       category: 'guest_separation',    unitType: 'sqm',     unitCost: 45,    diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'privacy_landscaping',    description: 'Privacy landscaping',                  description_it: 'Piantumazione privacy',                category: 'guest_separation',    unitType: 'forfait', unitCost: 2000,  diyLaborPercent: 80,   isRegulated: false, taxBonus: 'none',             toggleable: false, isOngoing: false },
  { key: 'guest_terrace',          description: 'Guest terrace',                        description_it: 'Terrazza ospiti',                      category: 'guest_separation',    unitType: 'unit',    unitCost: 3500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'guest_parking',          description: 'Guest parking area',                   description_it: 'Parcheggio ospiti',                    category: 'guest_separation',    unitType: 'forfait', unitCost: 1500,  diyLaborPercent: 60,   isRegulated: false, taxBonus: 'none',             toggleable: false, isOngoing: false },

  // ─── Energy ───────────────────────────────────────────────────────────
  { key: 'solar_pv',               description: 'Solar PV panels',                     description_it: 'Pannelli fotovoltaici',                category: 'energy',              unitType: 'kw',      unitCost: 1200,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: true, isOngoing: false },
  { key: 'battery_storage',        description: 'Battery storage',                      description_it: 'Accumulo batterie',                    category: 'energy',              unitType: 'kwh',     unitCost: 500,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: true, isOngoing: false },
  { key: 'ape_certification',      description: 'APE energy certification',             description_it: 'Certificazione APE',                   category: 'energy',              unitType: 'forfait', unitCost: 400,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'none',             toggleable: false, isOngoing: false },
  { key: 'enea_filing',            description: 'ENEA filing',                          description_it: 'Pratica ENEA',                         category: 'energy',              unitType: 'forfait', unitCost: 300,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'none',             toggleable: false, isOngoing: false },

  // ─── Vehicles & Equipment (toggleable) ────────────────────────────────
  { key: 'suv_4x4',                description: 'Volvo XC60 T8 Recharge (2024, used)',  description_it: 'Volvo XC60 T8 Recharge (2024, usato)', category: 'vehicles_equipment',  unitType: 'forfait', unitCost: 35000, diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'vehicles', isOngoing: false },
  { key: 'second_car',             description: 'Toyota Hilux Double Cab 4×4 (2020, used)', description_it: 'Toyota Hilux Double Cab 4×4 (2020, usato)', category: 'vehicles_equipment',  unitType: 'forfait', unitCost: 22000, diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'vehicles', isOngoing: false },
  { key: 'car_insurance',          description: 'Car insurance (per vehicle)',           description_it: 'Assicurazione auto (per veicolo)',     category: 'vehicles_equipment',  unitType: 'year',    unitCost: 1200,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'vehicles', isOngoing: true },
  { key: 'car_registration',       description: 'Car registration',                     description_it: 'Immatricolazione auto',                category: 'vehicles_equipment',  unitType: 'unit',    unitCost: 500,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'vehicles', isOngoing: false },
  { key: 'tractor_atv',            description: 'Tractor / ATV',                        description_it: 'Trattore / ATV',                       category: 'vehicles_equipment',  unitType: 'forfait', unitCost: 8000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'vehicles', isOngoing: false },
  { key: 'horse_trailer',          description: 'Horse trailer',                        description_it: 'Rimorchio cavalli',                    category: 'vehicles_equipment',  unitType: 'forfait', unitCost: 6500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'vehicles', isOngoing: false },
  { key: 'tools_workshop',         description: 'Tools & workshop setup',               description_it: 'Attrezzi e officina',                  category: 'vehicles_equipment',  unitType: 'forfait', unitCost: 3000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'vehicles', isOngoing: false },
  { key: 'ev_charger',             description: 'EV charger',                           description_it: 'Colonnina ricarica EV',                category: 'vehicles_equipment',  unitType: 'forfait', unitCost: 2500,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: true, toggleGroup: 'vehicles', isOngoing: false },

  // ─── Swimming Pool (toggleable group, radio for pool type) ────────────
  { key: 'pool_concrete',          description: 'Concrete pool',                        description_it: 'Piscina in cemento',                   category: 'swimming_pool',       unitType: 'forfait', unitCost: 55000, diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'none',             toggleable: true, toggleGroup: 'pool', radioGroup: 'pool_type', isOngoing: false },
  { key: 'pool_liner',             description: 'Liner pool',                           description_it: 'Piscina con liner',                    category: 'swimming_pool',       unitType: 'forfait', unitCost: 42000, diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'none',             toggleable: true, toggleGroup: 'pool', radioGroup: 'pool_type', isOngoing: false },
  { key: 'pool_terrace',           description: 'Pool terrace / surround',              description_it: 'Bordo piscina',                        category: 'swimming_pool',       unitType: 'sqm',     unitCost: 95,    diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'pool', isOngoing: false },
  { key: 'pool_equipment',         description: 'Pool equipment (pump, filter, cover)',  description_it: 'Attrezzatura piscina',                 category: 'swimming_pool',       unitType: 'forfait', unitCost: 5000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'pool', isOngoing: false },
  { key: 'pool_maintenance',       description: 'Pool annual maintenance',              description_it: 'Manutenzione annuale piscina',         category: 'swimming_pool',       unitType: 'year',    unitCost: 3300,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'pool', isOngoing: true },

  // ─── Home Gym (toggleable, radio for location + equipment) ────────────
  { key: 'gym_in_house',           description: 'Home gym (in-house room)',             description_it: 'Palestra in casa',                     category: 'home_gym',            unitType: 'forfait', unitCost: 8000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'gym', radioGroup: 'gym_location', isOngoing: false },
  { key: 'gym_in_outbuilding',     description: 'Home gym (outbuilding conversion)',    description_it: 'Palestra in annesso',                  category: 'home_gym',            unitType: 'forfait', unitCost: 28000, diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: true, toggleGroup: 'gym', radioGroup: 'gym_location', isOngoing: false },
  { key: 'gym_separate_build',     description: 'Home gym (separate build)',            description_it: 'Palestra costruzione separata',        category: 'home_gym',            unitType: 'forfait', unitCost: 64000, diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'none',             toggleable: true, toggleGroup: 'gym', radioGroup: 'gym_location', isOngoing: false },
  { key: 'gym_equipment_basic',    description: 'Gym equipment (basic)',                description_it: 'Attrezzatura palestra (base)',         category: 'home_gym',            unitType: 'forfait', unitCost: 3000,  diyLaborPercent: 95,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'gym', radioGroup: 'gym_equipment', isOngoing: false },
  { key: 'gym_equipment_full',     description: 'Gym equipment (full)',                 description_it: 'Attrezzatura palestra (completa)',     category: 'home_gym',            unitType: 'forfait', unitCost: 8000,  diyLaborPercent: 95,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'gym', radioGroup: 'gym_equipment', isOngoing: false },

  // ─── Greenhouse & Growing (toggleable) ────────────────────────────────
  { key: 'greenhouse',             description: 'Greenhouse 4×6m',                      description_it: 'Serra 4×6m',                           category: 'greenhouse_growing',  unitType: 'forfait', unitCost: 4500,  diyLaborPercent: 70,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'greenhouse', isOngoing: false },
  { key: 'raised_beds',            description: 'Raised beds',                          description_it: 'Aiuole rialzate',                      category: 'greenhouse_growing',  unitType: 'forfait', unitCost: 2200,  diyLaborPercent: 80,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'greenhouse', isOngoing: false },
  { key: 'vines_grapes',           description: 'Vines / grapes',                       description_it: 'Viti / uva',                           category: 'greenhouse_growing',  unitType: 'forfait', unitCost: 200,   diyLaborPercent: 80,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'greenhouse', isOngoing: false },
  { key: 'compost',                description: 'Compost system',                       description_it: 'Sistema compostaggio',                 category: 'greenhouse_growing',  unitType: 'forfait', unitCost: 1000,  diyLaborPercent: 80,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'greenhouse', isOngoing: false },
  { key: 'irrigation_3zone',       description: 'Irrigation (3-zone)',                  description_it: 'Irrigazione (3 zone)',                 category: 'greenhouse_growing',  unitType: 'forfait', unitCost: 1500,  diyLaborPercent: 65,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'greenhouse', isOngoing: false },

  // ─── Perimeter & Security (toggleable) ────────────────────────────────
  { key: 'stone_walls',            description: 'Perimeter stone walls',                description_it: 'Muri perimetrali in pietra',           category: 'perimeter_security',  unitType: 'lin_m',   unitCost: 350,   diyLaborPercent: 50,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'perimeter', isOngoing: false },
  { key: 'iron_gates',             description: 'Iron gates',                           description_it: 'Cancelli in ferro',                    category: 'perimeter_security',  unitType: 'forfait', unitCost: 5500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'perimeter', isOngoing: false },
  { key: 'perimeter_fencing',      description: 'Perimeter fencing',                    description_it: 'Recinzione perimetrale',               category: 'perimeter_security',  unitType: 'lin_m',   unitCost: 35,    diyLaborPercent: 65,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'perimeter', isOngoing: false },
  { key: 'boar_fencing',           description: 'Boar fencing',                         description_it: 'Recinzione anti-cinghiale',            category: 'perimeter_security',  unitType: 'hectare', unitCost: 3500,  diyLaborPercent: 65,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'perimeter', isOngoing: false },
  { key: 'security_cameras',       description: 'Security camera system',               description_it: 'Sistema videosorveglianza',            category: 'perimeter_security',  unitType: 'forfait', unitCost: 2500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'perimeter', isOngoing: false },
  { key: 'smart_locks',            description: 'Smart locks',                          description_it: 'Serrature smart',                      category: 'perimeter_security',  unitType: 'forfait', unitCost: 2000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'perimeter', isOngoing: false },
  { key: 'wifi_mesh',              description: 'WiFi mesh system',                     description_it: 'Sistema WiFi mesh',                    category: 'perimeter_security',  unitType: 'forfait', unitCost: 1500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'perimeter', isOngoing: false },

  // ─── Outdoor Hospitality (toggleable) ─────────────────────────────────
  { key: 'courtyard_paving',       description: 'Courtyard paving',                    description_it: 'Pavimentazione cortile',               category: 'outdoor_hospitality', unitType: 'sqm',     unitCost: 65,    diyLaborPercent: 60,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: true, toggleGroup: 'outdoor_hospitality', isOngoing: false },
  { key: 'pergola',                description: 'Pergola',                              description_it: 'Pergolato',                            category: 'outdoor_hospitality', unitType: 'forfait', unitCost: 3000,  diyLaborPercent: 55,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'outdoor_hospitality', isOngoing: false },
  { key: 'pizza_oven',             description: 'Wood-fired pizza oven',                description_it: 'Forno a legna per pizza',              category: 'outdoor_hospitality', unitType: 'forfait', unitCost: 4500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'outdoor_hospitality', isOngoing: false },
  { key: 'wine_bar_counter',       description: 'Wine bar counter',                     description_it: 'Bancone wine bar',                     category: 'outdoor_hospitality', unitType: 'forfait', unitCost: 1800,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'outdoor_hospitality', isOngoing: false },
  { key: 'farmhouse_table',        description: 'Farmhouse dining table',               description_it: 'Tavolo conviviale',                    category: 'outdoor_hospitality', unitType: 'forfait', unitCost: 1600,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'mobili',           toggleable: true, toggleGroup: 'outdoor_hospitality', isOngoing: false },
  { key: 'outdoor_lighting_hosp',  description: 'Outdoor lighting (hospitality)',       description_it: 'Illuminazione esterna (ospitalità)',   category: 'outdoor_hospitality', unitType: 'forfait', unitCost: 800,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'outdoor_hospitality', isOngoing: false },
  { key: 'courtyard_landscaping',  description: 'Courtyard landscaping',                description_it: 'Paesaggistica cortile',                category: 'outdoor_hospitality', unitType: 'forfait', unitCost: 1200,  diyLaborPercent: 80,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'outdoor_hospitality', isOngoing: false },
  { key: 'outdoor_hosp_annual',    description: 'Outdoor hospitality annual upkeep',    description_it: 'Manutenzione annuale area ospitalità', category: 'outdoor_hospitality', unitType: 'year',    unitCost: 1275,  diyLaborPercent: 80,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'outdoor_hospitality', isOngoing: true },

  // ─── Livestock (each toggleable independently) ────────────────────────
  { key: 'chicken_coop',           description: 'Chicken coop',                         description_it: 'Pollaio',                              category: 'livestock',           unitType: 'forfait', unitCost: 3500,  diyLaborPercent: 70,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'chickens', isOngoing: false },
  { key: 'chicken_flock',          description: 'Chicken flock (initial purchase)',      description_it: 'Acquisto galline',                     category: 'livestock',           unitType: 'forfait', unitCost: 200,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'chickens', isOngoing: false },
  { key: 'chicken_annual',         description: 'Chickens annual costs',                description_it: 'Costi annuali galline',                category: 'livestock',           unitType: 'year',    unitCost: 690,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'chickens', isOngoing: true },

  { key: 'goat_shelter',           description: 'Goat shelter',                         description_it: 'Ricovero capre',                       category: 'livestock',           unitType: 'forfait', unitCost: 5000,  diyLaborPercent: 70,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'goats', isOngoing: false },
  { key: 'goat_paddock',           description: 'Goat paddock fencing',                 description_it: 'Recinzione paddock capre',             category: 'livestock',           unitType: 'forfait', unitCost: 2000,  diyLaborPercent: 65,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'goats', isOngoing: false },
  { key: 'goat_purchase',          description: 'Goat purchase',                        description_it: 'Acquisto capre',                       category: 'livestock',           unitType: 'forfait', unitCost: 600,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'goats', isOngoing: false },
  { key: 'goat_milking_stand',     description: 'Milking stand',                        description_it: 'Postazione mungitura',                 category: 'livestock',           unitType: 'forfait', unitCost: 300,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'goats', isOngoing: false },
  { key: 'goat_annual',            description: 'Goats annual costs',                   description_it: 'Costi annuali capre',                  category: 'livestock',           unitType: 'year',    unitCost: 1550,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'goats', isOngoing: true },

  { key: 'horse_stable',           description: 'Horse stable',                         description_it: 'Scuderia',                             category: 'livestock',           unitType: 'forfait', unitCost: 12000, diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'horses', isOngoing: false },
  { key: 'horse_paddock',          description: 'Horse paddock fencing',                description_it: 'Recinzione paddock cavalli',           category: 'livestock',           unitType: 'forfait', unitCost: 4000,  diyLaborPercent: 65,   isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'horses', isOngoing: false },
  { key: 'horse_purchase',         description: 'Horse purchase',                       description_it: 'Acquisto cavallo',                     category: 'livestock',           unitType: 'unit',    unitCost: 5000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'horses', isOngoing: false },
  { key: 'horse_trailer_ls',       description: 'Horse trailer',                        description_it: 'Rimorchio cavalli',                    category: 'livestock',           unitType: 'forfait', unitCost: 6500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'horses', isOngoing: false },
  { key: 'horse_annual',           description: 'Horses annual costs (per horse)',       description_it: 'Costi annuali cavalli (per cavallo)',  category: 'livestock',           unitType: 'year',    unitCost: 6000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'horses', isOngoing: true },

  { key: 'dog_purchase',           description: 'Dog purchase',                         description_it: 'Acquisto cane',                        category: 'livestock',           unitType: 'forfait', unitCost: 500,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'dog', isOngoing: false },
  { key: 'dog_annual',             description: 'Dog annual costs',                     description_it: 'Costi annuali cane',                   category: 'livestock',           unitType: 'year',    unitCost: 1200,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'dog', isOngoing: true },

  // ─── Site Work ────────────────────────────────────────────────────────
  { key: 'driveway',               description: 'Driveway',                             description_it: 'Vialetto d\'accesso',                  category: 'site_work',           unitType: 'forfait', unitCost: 5500,  diyLaborPercent: 60,   isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'outdoor_lighting',       description: 'Outdoor lighting (site)',              description_it: 'Illuminazione esterna (terreno)',      category: 'site_work',           unitType: 'forfait', unitCost: 2500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'rainwater_cistern',      description: 'Rainwater cistern',                    description_it: 'Cisterna acqua piovana',               category: 'site_work',           unitType: 'forfait', unitCost: 4500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'ecobonus',         toggleable: true, isOngoing: false },
  { key: 'rainwater_plumbing',     description: 'Rainwater plumbing connection',        description_it: 'Impianto idraulico acqua piovana',     category: 'site_work',           unitType: 'forfait', unitCost: 1800,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: true, isOngoing: false },
  { key: 'tree_cypress_work',      description: 'Tree / cypress work',                  description_it: 'Potatura alberi / cipressi',           category: 'site_work',           unitType: 'forfait', unitCost: 2500,  diyLaborPercent: 80,   isRegulated: false, taxBonus: 'none',             toggleable: false, isOngoing: false },
  { key: 'landscape_architect',    description: 'Landscape architect',                  description_it: 'Architetto paesaggista',               category: 'site_work',           unitType: 'forfait', unitCost: 4000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: false, isOngoing: false },

  // ─── Transition & Setup (toggleable) ──────────────────────────────────
  { key: 'international_move',     description: 'International move',                   description_it: 'Trasloco internazionale',              category: 'transition_setup',    unitType: 'forfait', unitCost: 8000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'furniture_main',         description: 'Furniture (main house)',                description_it: 'Arredamento (casa principale)',        category: 'transition_setup',    unitType: 'forfait', unitCost: 20000, diyLaborPercent: 95,   isRegulated: false, taxBonus: 'mobili',           toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'furniture_airbnb',       description: 'Furniture (per Airbnb unit)',           description_it: 'Arredamento (per unità Airbnb)',       category: 'transition_setup',    unitType: 'unit',    unitCost: 6000,  diyLaborPercent: 95,   isRegulated: false, taxBonus: 'mobili',           toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'appliances',             description: 'Appliances',                           description_it: 'Elettrodomestici',                     category: 'transition_setup',    unitType: 'forfait', unitCost: 5000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'mobili',           toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'internet_setup',         description: 'Internet setup',                       description_it: 'Installazione internet',               category: 'transition_setup',    unitType: 'forfait', unitCost: 500,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'health_insurance_y1',    description: 'Health insurance (Year 1)',             description_it: 'Assicurazione sanitaria (Anno 1)',     category: 'transition_setup',    unitType: 'forfait', unitCost: 6000,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'food_living_y1',         description: 'Food & living costs (Year 1)',          description_it: 'Vitto e spese quotidiane (Anno 1)',    category: 'transition_setup',    unitType: 'forfait', unitCost: 10000, diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'bureaucracy',            description: 'Bureaucracy & admin costs',             description_it: 'Burocrazia e costi amministrativi',   category: 'transition_setup',    unitType: 'forfait', unitCost: 1500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'language_tutoring',      description: 'Language tutoring',                     description_it: 'Corso di lingua',                      category: 'transition_setup',    unitType: 'forfait', unitCost: 2500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'return_trips_build',     description: 'Return trips during build',            description_it: 'Viaggi di ritorno durante lavori',     category: 'transition_setup',    unitType: 'forfait', unitCost: 2500,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'transition', isOngoing: false },
  { key: 'codice_residency',       description: 'Codice fiscale & residency',           description_it: 'Codice fiscale e residenza',           category: 'transition_setup',    unitType: 'forfait', unitCost: 400,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'transition', isOngoing: false },

  // ─── Professional Fees ────────────────────────────────────────────────
  { key: 'geometra',               description: 'Geometra (10% of construction)',       description_it: 'Geometra (10% dei lavori)',            category: 'professional_fees',   unitType: 'pct',     unitCost: 10,    diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'structural_engineer',    description: 'Structural engineer',                  description_it: 'Ingegnere strutturista',               category: 'professional_fees',   unitType: 'forfait', unitCost: 5000,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ristrutturazione', toggleable: false, isOngoing: false },
  { key: 'energy_consultant',      description: 'Energy consultant',                    description_it: 'Consulente energetico',                category: 'professional_fees',   unitType: 'forfait', unitCost: 400,   diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'ecobonus',         toggleable: false, isOngoing: false },
  { key: 'notaio_construction',    description: 'Notaio (construction)',                description_it: 'Notaio (lavori edili)',                category: 'professional_fees',   unitType: 'forfait', unitCost: 1500,  diyLaborPercent: 0,    isRegulated: true,  taxBonus: 'none',             toggleable: false, isOngoing: false },
  { key: 'contingency',            description: 'Contingency (20% — mandatory N2)',     description_it: 'Imprevisti (20% — obbligatorio N2)',   category: 'professional_fees',   unitType: 'pct',     unitCost: 20,    diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: false, isOngoing: false },

  // ─── Ongoing Operating Costs ──────────────────────────────────────────
  { key: 'pool_monthly',           description: 'Pool maintenance (monthly)',           description_it: 'Manutenzione piscina (mensile)',       category: 'operating',           unitType: 'month',   unitCost: 275,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, toggleGroup: 'pool', isOngoing: true },
  { key: 'grounds_labor',          description: 'Grounds labor (if hired)',             description_it: 'Giardiniere (se assunto)',             category: 'operating',           unitType: 'month',   unitCost: 1100,  diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, isOngoing: true },
  { key: 'caretaker',              description: 'Caretaker (if remote)',                description_it: 'Custode (se assente)',                 category: 'operating',           unitType: 'month',   unitCost: 700,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, isOngoing: true },
  { key: 'lpg_gas',                description: 'LPG gas (if not mains)',              description_it: 'GPL (se non allacciato)',              category: 'operating',           unitType: 'month',   unitCost: 300,   diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: true, isOngoing: true },
  { key: 'rai_tv_licence',         description: 'RAI TV licence',                       description_it: 'Canone RAI',                           category: 'operating',           unitType: 'year',    unitCost: 90,    diyLaborPercent: 0,    isRegulated: false, taxBonus: 'none',             toggleable: false, isOngoing: true },
];

// ─── Lookup helpers ─────────────────────────────────────────────────────────

const _byKey = new Map(COST_LINE_ITEMS.map((item) => [item.key, item]));

export function getLineItem(key: string): CostLineItem | undefined {
  return _byKey.get(key);
}

export function getItemsByCategory(category: ItemCategory): CostLineItem[] {
  return COST_LINE_ITEMS.filter((item) => item.category === category);
}

export function getToggleGroup(groupKey: string): CostLineItem[] {
  return COST_LINE_ITEMS.filter((item) => item.toggleGroup === groupKey);
}

export function getRadioGroup(radioKey: string): CostLineItem[] {
  return COST_LINE_ITEMS.filter((item) => item.radioGroup === radioKey);
}

export function getOngoingItems(): CostLineItem[] {
  return COST_LINE_ITEMS.filter((item) => item.isOngoing);
}

export function getRegulatedItems(): CostLineItem[] {
  return COST_LINE_ITEMS.filter((item) => item.isRegulated);
}

const HOSTING_ONLY_CATEGORIES = new Set<ItemCategory>(['guest_separation']);
const HOSTING_ONLY_KEYS: Set<string> = new Set(['kitchen_airbnb', 'furniture_airbnb']);

export function getItemsForProjectType(projectType: 'private_homestead' | 'farmstead_hosting'): CostLineItem[] {
  if (projectType === 'farmstead_hosting') return COST_LINE_ITEMS;
  return COST_LINE_ITEMS.filter(
    (item) => !HOSTING_ONLY_CATEGORIES.has(item.category) && !HOSTING_ONLY_KEYS.has(item.key),
  );
}

export function getCategoriesForProjectType(projectType: 'private_homestead' | 'farmstead_hosting') {
  if (projectType === 'farmstead_hosting') return ALL_CATEGORIES;
  return ALL_CATEGORIES.filter((c) => !HOSTING_ONLY_CATEGORIES.has(c.key));
}

export function getDiyEligibleItems(): CostLineItem[] {
  return COST_LINE_ITEMS.filter((item) => item.diyLaborPercent > 0);
}

export function computeItemCost(
  item: CostLineItem,
  quantity: number,
  regionalMultiplier: number,
  diyEnabled: boolean,
): number {
  if (item.isRegulated && diyEnabled) {
    return Math.round(item.unitCost * quantity * regionalMultiplier);
  }
  const laborDiscount = diyEnabled ? item.diyLaborPercent / 100 : 0;
  return Math.round(item.unitCost * quantity * regionalMultiplier * (1 - laborDiscount));
}

export const ALL_CATEGORIES: { key: ItemCategory; label: string; label_it: string }[] = [
  { key: 'structural_envelope',  label: 'Structural & Envelope',   label_it: 'Struttura e Involucro' },
  { key: 'windows_doors',        label: 'Windows & Doors',         label_it: 'Finestre e Porte' },
  { key: 'systems',              label: 'Systems',                 label_it: 'Impianti' },
  { key: 'interior_finishes',    label: 'Interior Finishes',       label_it: 'Finiture Interne' },
  { key: 'guest_separation',     label: 'Guest Separation',        label_it: 'Separazione Ospiti' },
  { key: 'energy',               label: 'Energy',                  label_it: 'Energia' },
  { key: 'vehicles_equipment',   label: 'Vehicles & Equipment',    label_it: 'Veicoli e Attrezzature' },
  { key: 'swimming_pool',        label: 'Swimming Pool',           label_it: 'Piscina' },
  { key: 'home_gym',             label: 'Home Gym',                label_it: 'Palestra' },
  { key: 'greenhouse_growing',   label: 'Greenhouse & Growing',    label_it: 'Serra e Coltivazione' },
  { key: 'perimeter_security',   label: 'Perimeter & Security',    label_it: 'Perimetro e Sicurezza' },
  { key: 'outdoor_hospitality',  label: 'Outdoor Hospitality',     label_it: 'Ospitalità Esterna' },
  { key: 'livestock',            label: 'Livestock',               label_it: 'Animali' },
  { key: 'site_work',            label: 'Site Work',               label_it: 'Lavori Esterni' },
  { key: 'transition_setup',     label: 'Transition & Setup',      label_it: 'Transizione e Avvio' },
  { key: 'professional_fees',    label: 'Professional Fees',       label_it: 'Onorari Professionali' },
  { key: 'operating',            label: 'Ongoing Operating',       label_it: 'Costi Operativi Ricorrenti' },
];
