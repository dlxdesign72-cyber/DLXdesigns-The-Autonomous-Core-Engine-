-- Migration: create prospects, evidence, qualification_decisions, sales_opportunities, outreach_events, audit_events
-- Non-destructive: only create missing tables/columns; do not drop or alter existing production-only tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Prospects
CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  phone_number text,
  normalized_phone text,
  email text,
  normalized_email text,
  product_interest text,
  location jsonb,
  current_stage text DEFAULT 'NEW',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  source text NOT NULL,
  source_url text,
  captured_at timestamptz DEFAULT now(),
  raw_signal jsonb,
  evidence_type text,
  provenance text NOT NULL CHECK (provenance IN ('HUNTER_DISCOVERED', 'EXTERNALLY_SUPPLIED')),
  created_at timestamptz DEFAULT now()
);

-- Qualification decisions
CREATE TABLE IF NOT EXISTS qualification_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  score numeric,
  tier text,
  approved boolean,
  reason text,
  reasoning_model text,
  evidence_ref uuid,
  created_at timestamptz DEFAULT now()
);

-- Sales opportunities
CREATE TABLE IF NOT EXISTS sales_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  opportunity_value numeric,
  quoted_amount numeric,
  revenue_realized numeric DEFAULT 0,
  stage text,
  source_evidence_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Outreach events
CREATE TABLE IF NOT EXISTS outreach_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  channel text,
  event_type text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Audit events
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text,
  action text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prospects_normalized_phone ON prospects(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_prospects_normalized_email ON prospects(normalized_email);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_prospect_id ON evidence(prospect_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_prospect_id ON sales_opportunities(prospect_id);
