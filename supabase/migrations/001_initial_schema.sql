-- Progetto Casa Colonica — Initial Schema
-- Migration: 001_initial_schema
-- All monetary values stored as integers in euros (€180,000 = 180000)
-- user_id is the Clerk user ID (text), not a Supabase auth UID

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX projects_user_id_idx ON projects(user_id);

-- ─────────────────────────────────────────────
-- SEARCH CRITERIA (one per project)
-- ─────────────────────────────────────────────
CREATE TABLE search_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  min_sqm_house INTEGER,
  max_sqm_house INTEGER,
  min_sqm_land INTEGER,
  max_purchase_price INTEGER NOT NULL DEFAULT 0,
  max_all_in_cost INTEGER NOT NULL DEFAULT 0,
  regions TEXT[] DEFAULT '{}',
  provinces TEXT[] DEFAULT '{}',
  must_have_olive_grove BOOLEAN DEFAULT FALSE,
  must_allow_animals BOOLEAN DEFAULT FALSE,
  must_have_outbuildings BOOLEAN DEFAULT FALSE,
  requires_agriturismo_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SCORING WEIGHTS (one per project)
-- ─────────────────────────────────────────────
CREATE TABLE scoring_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL DEFAULT 0.12,
  all_in_cost NUMERIC NOT NULL DEFAULT 0.12,
  structural_condition NUMERIC NOT NULL DEFAULT 0.12,
  airbnb_potential NUMERIC NOT NULL DEFAULT 0.12,
  regulatory_risk NUMERIC NOT NULL DEFAULT 0.12,
  lifestyle_fit NUMERIC NOT NULL DEFAULT 0.10,
  location_quality NUMERIC NOT NULL DEFAULT 0.08,
  land_characteristics NUMERIC NOT NULL DEFAULT 0.08,
  outbuilding_potential NUMERIC NOT NULL DEFAULT 0.05,
  negotiation_margin NUMERIC NOT NULL DEFAULT 0.05,
  exit_value NUMERIC NOT NULL DEFAULT 0.04,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT weights_sum_check CHECK (
    ABS((purchase_price + all_in_cost + structural_condition + airbnb_potential +
         regulatory_risk + lifestyle_fit + location_quality + land_characteristics +
         outbuilding_potential + negotiation_margin + exit_value) - 1.0) < 0.001
  )
);

-- ─────────────────────────────────────────────
-- PROPERTIES
-- ─────────────────────────────────────────────
CREATE TYPE property_pipeline_stage AS ENUM (
  'scouted', 'analyzing', 'shortlisted', 'site_visit',
  'negotiating', 'under_contract', 'closing',
  'acquired', 'renovating', 'complete'
);

CREATE TYPE energy_class AS ENUM ('A4','A3','A2','A1','B','C','D','E','F','G');

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pipeline_stage property_pipeline_stage NOT NULL DEFAULT 'scouted',

  -- listing data (denormalized for query performance)
  listing_url TEXT,
  listing_source TEXT,
  listed_price INTEGER NOT NULL DEFAULT 0,
  negotiated_price INTEGER,
  sqm_house INTEGER NOT NULL DEFAULT 0,
  sqm_land INTEGER NOT NULL DEFAULT 0,
  num_bedrooms INTEGER DEFAULT 0,
  num_bathrooms INTEGER DEFAULT 0,
  year_built INTEGER,
  energy_class energy_class,
  has_olive_grove BOOLEAN DEFAULT FALSE,
  olive_tree_count INTEGER,
  has_vineyard BOOLEAN DEFAULT FALSE,
  has_outbuildings BOOLEAN DEFAULT FALSE,
  outbuilding_sqm INTEGER,
  has_pool BOOLEAN DEFAULT FALSE,
  has_pizza_oven BOOLEAN DEFAULT FALSE,
  commune TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  lat NUMERIC,
  lng NUMERIC,
  listing_description TEXT,
  land_ha NUMERIC GENERATED ALWAYS AS (sqm_land::NUMERIC / 10000.0) STORED,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX properties_project_id_idx ON properties(project_id);
CREATE INDEX properties_user_id_idx ON properties(user_id);
CREATE INDEX properties_pipeline_stage_idx ON properties(pipeline_stage);

-- ─────────────────────────────────────────────
-- PROPERTY PHOTOS
-- ─────────────────────────────────────────────
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'exterior',
  is_primary BOOLEAN DEFAULT FALSE,
  confidence_contribution NUMERIC DEFAULT 0,
  upload_step INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX property_photos_property_id_idx ON property_photos(property_id);

-- ─────────────────────────────────────────────
-- AI ANALYSIS
-- ─────────────────────────────────────────────
CREATE TYPE regulatory_risk AS ENUM ('red', 'yellow', 'green');
CREATE TYPE confidence_level AS ENUM ('estimated', 'quoted', 'confirmed', 'actual');

CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  structural_condition_score NUMERIC,
  structural_notes TEXT,
  roof_condition TEXT,
  systems_condition TEXT,
  guest_separation_feasible BOOLEAN,
  guest_separation_notes TEXT,
  guest_separation_cost_min INTEGER DEFAULT 0,
  guest_separation_cost_max INTEGER DEFAULT 0,
  voltage_concerns TEXT[] DEFAULT '{}',
  renovation_complexity TEXT,
  key_risks TEXT[] DEFAULT '{}',
  key_opportunities TEXT[] DEFAULT '{}',
  raw_response TEXT,
  confidence_level confidence_level NOT NULL DEFAULT 'estimated',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE regulatory_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  str_zoning regulatory_risk,
  str_zoning_notes TEXT,
  change_of_use regulatory_risk,
  change_of_use_notes TEXT,
  building_permits regulatory_risk,
  building_permits_notes TEXT,
  landscape_protection regulatory_risk,
  landscape_protection_notes TEXT,
  seismic_zone TEXT,
  seismic_risk regulatory_risk,
  animals_permitted regulatory_risk,
  animals_notes TEXT,
  septic_water regulatory_risk,
  septic_water_notes TEXT,
  fire_safety regulatory_risk,
  fire_safety_notes TEXT,
  business_classification regulatory_risk,
  business_classification_notes TEXT,
  tax_regime_risk regulatory_risk,
  tax_regime_notes TEXT,
  overall_risk regulatory_risk,
  has_red_flag BOOLEAN GENERATED ALWAYS AS (overall_risk = 'red') STORED,
  agriturismo_eligible BOOLEAN DEFAULT FALSE,
  agriturismo_path_notes TEXT,
  land_threshold_alerts JSONB DEFAULT '[]',
  wild_boar_risk BOOLEAN DEFAULT FALSE,
  boar_fencing_cost_estimate INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE energy_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  current_class energy_class,
  target_class energy_class,
  insulation_needed BOOLEAN,
  heat_pump_feasible BOOLEAN,
  solar_pv_feasible BOOLEAN,
  solar_pv_kw NUMERIC,
  window_upgrade_needed BOOLEAN,
  estimated_upgrade_cost_min INTEGER DEFAULT 0,
  estimated_upgrade_cost_max INTEGER DEFAULT 0,
  annual_energy_cost_before INTEGER DEFAULT 0,
  annual_energy_cost_after INTEGER DEFAULT 0,
  payback_years NUMERIC,
  ecobonus_eligible BOOLEAN DEFAULT FALSE,
  confidence_level confidence_level DEFAULT 'estimated',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE layout_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  conflicts JSONB DEFAULT '[]',
  guest_entrance_independent BOOLEAN,
  courtyard_usable BOOLEAN,
  animal_zone_compatible BOOLEAN,
  solar_compatible BOOLEAN,
  parking_sufficient BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SCORING RESULTS
-- ─────────────────────────────────────────────
CREATE TYPE overall_rating AS ENUM ('strong_candidate', 'promising', 'marginal', 'not_recommended');

CREATE TABLE scoring_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  total_weighted_score NUMERIC NOT NULL DEFAULT 0,
  overall_rating overall_rating NOT NULL DEFAULT 'marginal',
  -- Constitution N3: red flag always overrides to not_recommended
  red_flag_override BOOLEAN NOT NULL DEFAULT FALSE,
  red_flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- RENOVATION SCENARIOS
-- ─────────────────────────────────────────────
CREATE TYPE scenario_type AS ENUM ('basic', 'lifestyle', 'high_end', 'custom');

CREATE TABLE renovation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type scenario_type NOT NULL,
  name TEXT NOT NULL,
  name_it TEXT NOT NULL,
  phases JSONB NOT NULL DEFAULT '[]',
  farm_features JSONB NOT NULL DEFAULT '[]',
  outbuilding_conversions JSONB NOT NULL DEFAULT '[]',
  renovation_total_min INTEGER NOT NULL DEFAULT 0,
  renovation_total_max INTEGER NOT NULL DEFAULT 0,
  renovation_duration_months INTEGER NOT NULL DEFAULT 0,
  -- Constitution N2: contingency is mandatory (15-25%)
  contingency_pct NUMERIC NOT NULL DEFAULT 0.20,
  contingency_amount INTEGER NOT NULL DEFAULT 0,
  guest_separation_included BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_level confidence_level NOT NULL DEFAULT 'estimated',
  generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX renovation_scenarios_property_id_idx ON renovation_scenarios(property_id);

-- ─────────────────────────────────────────────
-- ARV ESTIMATES
-- ─────────────────────────────────────────────
CREATE TABLE arv_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES renovation_scenarios(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  estimated_arv INTEGER NOT NULL DEFAULT 0,
  comparable_properties TEXT[] DEFAULT '{}',
  price_per_sqm INTEGER DEFAULT 0,
  confidence_level confidence_level DEFAULT 'estimated',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FINANCIAL MODELS
-- ─────────────────────────────────────────────
CREATE TYPE housing_status AS ENUM ('primary_residence', 'second_home');
CREATE TYPE tax_regime AS ENUM ('cedolare_secca_21', 'cedolare_secca_26', 'progressive');

CREATE TABLE financial_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES renovation_scenarios(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Purchase
  purchase_costs JSONB NOT NULL DEFAULT '{}',

  -- Constitution N5: carrying costs are mandatory
  carrying_costs JSONB NOT NULL DEFAULT '{}',

  -- Operating costs (includes farmstead)
  operating_costs JSONB NOT NULL DEFAULT '{}',

  -- Tax
  housing_status housing_status NOT NULL DEFAULT 'second_home',
  tax_regime tax_regime NOT NULL DEFAULT 'cedolare_secca_21',
  impatriati_regime BOOLEAN DEFAULT FALSE,
  employment_type TEXT,
  employment_monthly_net INTEGER DEFAULT 0,
  employment_duration_months INTEGER DEFAULT 0,

  -- Income (5 lines)
  experience_income JSONB NOT NULL DEFAULT '{}',

  -- Constitution N1: income projection starts at Y2 partial, Y3 full
  income_projection JSONB NOT NULL DEFAULT '[]',

  -- Monthly resolution
  monthly_cashflow JSONB NOT NULL DEFAULT '[]',

  -- ROI
  roi_summary JSONB NOT NULL DEFAULT '{}',

  confidence_level confidence_level NOT NULL DEFAULT 'estimated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FUNDING SOURCES
-- ─────────────────────────────────────────────
CREATE TYPE funding_source_type AS ENUM (
  'property_sale', 'investment_liquidation', 'salary_savings',
  'existing_cash', 'currency_conversion', 'mortgage'
);

CREATE TABLE funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_model_id UUID NOT NULL REFERENCES financial_models(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type funding_source_type NOT NULL,
  description TEXT NOT NULL,
  amount_usd INTEGER,
  amount_eur INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  expected_date DATE,
  actual_date DATE,
  exchange_rate NUMERIC,
  confidence_pct NUMERIC DEFAULT 0.5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE currency_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  conversion_date DATE NOT NULL,
  amount_usd INTEGER NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  amount_eur INTEGER NOT NULL,
  fee INTEGER DEFAULT 0,
  net_eur INTEGER NOT NULL,
  provider TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INVOICES — Core cost tracking (Constitution P13, N9)
-- ─────────────────────────────────────────────
CREATE TYPE tax_bonus AS ENUM ('ristrutturazione', 'ecobonus', 'sismabonus', 'mobili', 'none');
CREATE TYPE payment_method AS ENUM ('bonifico_parlante', 'credit_card', 'cash', 'regular_transfer');

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES renovation_scenarios(id),
  user_id TEXT NOT NULL,

  -- OCR extracted
  vendor_name TEXT NOT NULL,
  vendor_partita_iva TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  amount_excl_iva INTEGER NOT NULL,
  iva_rate NUMERIC,
  iva_amount INTEGER,
  total_amount INTEGER NOT NULL,
  description TEXT,
  original_photo_url TEXT,

  -- Budget matching
  phase_number INTEGER,
  line_item_key TEXT,
  is_diy_materials BOOLEAN DEFAULT FALSE,

  -- Tax compliance (N9)
  tax_bonus tax_bonus,
  payment_method payment_method NOT NULL,
  is_tax_deductible BOOLEAN GENERATED ALWAYS AS (
    payment_method IN ('bonifico_parlante', 'credit_card')
    AND vendor_partita_iva IS NOT NULL
    AND tax_bonus IS NOT NULL
    AND tax_bonus != 'none'
  ) STORED,
  bonifico_text TEXT,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_date DATE,

  confidence_level confidence_level DEFAULT 'actual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX invoices_property_id_idx ON invoices(property_id);
CREATE INDEX invoices_user_id_idx ON invoices(user_id);
CREATE INDEX invoices_tax_bonus_idx ON invoices(tax_bonus);

-- ─────────────────────────────────────────────
-- TAX DEDUCTION TRACKER
-- ─────────────────────────────────────────────
CREATE TABLE tax_deduction_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  is_primary_residence BOOLEAN DEFAULT FALSE,

  -- Rates depend on residency status
  ristrutturazione_rate NUMERIC DEFAULT 0.36,
  ecobonus_rate NUMERIC DEFAULT 0.36,
  sismabonus_rate NUMERIC DEFAULT 0.36,

  -- 2026 caps in euros
  ristrutturazione_cap INTEGER DEFAULT 96000,
  ristrutturazione_spent INTEGER DEFAULT 0,
  ecobonus_cap INTEGER DEFAULT 100000,
  ecobonus_spent INTEGER DEFAULT 0,
  sismabonus_cap INTEGER DEFAULT 96000,
  sismabonus_spent INTEGER DEFAULT 0,
  mobili_cap INTEGER DEFAULT 5000,
  mobili_spent INTEGER DEFAULT 0,

  -- ENEA tracking for Ecobonus
  enea_work_completed_date DATE,
  enea_filing_deadline DATE GENERATED ALWAYS AS (
    enea_work_completed_date + INTERVAL '90 days'
  ) STORED,
  enea_filed BOOLEAN DEFAULT FALSE,
  enea_filed_date DATE,

  codice_fiscale TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DIY SAVINGS
-- ─────────────────────────────────────────────
CREATE TABLE diy_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES renovation_scenarios(id),
  user_id TEXT NOT NULL,
  phase_number INTEGER,
  line_item_key TEXT NOT NULL,
  description TEXT NOT NULL,
  contractor_estimate INTEGER NOT NULL,
  materials_actual INTEGER NOT NULL DEFAULT 0,
  savings_amount INTEGER GENERATED ALWAYS AS (
    contractor_estimate - materials_actual
  ) STORED,
  materials_deductible BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- RENDERINGS (Phase 2 — GPT Image 2)
-- ─────────────────────────────────────────────
CREATE TABLE renderings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES renovation_scenarios(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  view TEXT NOT NULL DEFAULT 'after',
  prompt_used TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  model TEXT DEFAULT 'gpt-image-2',
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  source_photo_url TEXT,
  is_inpainted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PIPELINE EVENTS
-- ─────────────────────────────────────────────
CREATE TABLE pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  from_stage property_pipeline_stage,
  to_stage property_pipeline_stage NOT NULL,
  triggered_by TEXT NOT NULL DEFAULT 'user',
  gate_overridden BOOLEAN DEFAULT FALSE,
  gate_override_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pipeline_events_property_id_idx ON pipeline_events(property_id);

-- ─────────────────────────────────────────────
-- DOCUMENTS
-- ─────────────────────────────────────────────
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CONTACTS
-- ─────────────────────────────────────────────
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  commune TEXT,
  province TEXT,
  language TEXT DEFAULT 'it',
  notes TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  recommended_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX contacts_user_id_idx ON contacts(user_id);

CREATE TABLE property_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role_override TEXT,
  engagement_status TEXT DEFAULT 'potential',
  quote_amount INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- OFFERS
-- ─────────────────────────────────────────────
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  offer_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  counter_amount INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SITE VISIT TRIPS
-- ─────────────────────────────────────────────
CREATE TABLE site_visit_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  planned_date DATE NOT NULL,
  actual_date DATE,
  duration_days INTEGER DEFAULT 3,
  estimated_cost INTEGER DEFAULT 0,
  actual_cost INTEGER,
  accommodation TEXT,
  contacts_to_meet TEXT[] DEFAULT '{}',
  checklist_items JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- OPERATIONAL CHECKLISTS
-- ─────────────────────────────────────────────
CREATE TABLE operational_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- Users see only their own data (user_id matches Clerk uid)
-- ─────────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE arv_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_deduction_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE diy_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE renderings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visit_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Helper: current Clerk user ID passed via app.current_user_id session variable
CREATE OR REPLACE FUNCTION current_clerk_uid() RETURNS TEXT AS $$
  SELECT current_setting('app.current_user_id', true);
$$ LANGUAGE sql STABLE;

-- RLS policies — user owns their own rows
CREATE POLICY projects_owner ON projects
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY search_criteria_owner ON search_criteria
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY scoring_weights_owner ON scoring_weights
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY properties_owner ON properties
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY property_photos_owner ON property_photos
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY ai_analyses_owner ON ai_analyses
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY regulatory_assessments_owner ON regulatory_assessments
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY energy_assessments_owner ON energy_assessments
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY layout_assessments_owner ON layout_assessments
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY scoring_results_owner ON scoring_results
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY renovation_scenarios_owner ON renovation_scenarios
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY arv_estimates_owner ON arv_estimates
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY financial_models_owner ON financial_models
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY funding_sources_owner ON funding_sources
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY currency_conversions_owner ON currency_conversions
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY invoices_owner ON invoices
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY tax_deduction_trackers_owner ON tax_deduction_trackers
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY diy_savings_owner ON diy_savings
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY renderings_owner ON renderings
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY pipeline_events_owner ON pipeline_events
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY documents_owner ON documents
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY contacts_owner ON contacts
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY property_contacts_owner ON property_contacts
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY offers_owner ON offers
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY site_visit_trips_owner ON site_visit_trips
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY operational_checklists_owner ON operational_checklists
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

CREATE POLICY notes_owner ON notes
  USING (user_id = current_clerk_uid())
  WITH CHECK (user_id = current_clerk_uid());

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER search_criteria_updated_at BEFORE UPDATE ON search_criteria
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER scoring_weights_updated_at BEFORE UPDATE ON scoring_weights
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER renovation_scenarios_updated_at BEFORE UPDATE ON renovation_scenarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER financial_models_updated_at BEFORE UPDATE ON financial_models
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tax_deduction_trackers_updated_at BEFORE UPDATE ON tax_deduction_trackers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER scoring_results_updated_at BEFORE UPDATE ON scoring_results
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
