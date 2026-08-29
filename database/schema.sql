-- DLX Designs Supabase schema

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: dlx_verified_leads
CREATE TABLE IF NOT EXISTS dlx_verified_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  phone_number text UNIQUE,
  email text,
  source_platform text,
  intent_score int CHECK (intent_score >= 1 AND intent_score <= 10),
  style_interest text,
  lead_status text DEFAULT 'new',
  raw_intent_signal jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table: dlx_oracle_logs
CREATE TABLE IF NOT EXISTS dlx_oracle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date date NOT NULL DEFAULT (now()::date),
  market_trend_summary text,
  competitor_analysis text,
  actionable_recommendation text,
  raw_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dlx_verified_leads_created_at ON dlx_verified_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dlx_verified_leads_intent ON dlx_verified_leads (intent_score DESC);
CREATE INDEX IF NOT EXISTS idx_dlx_oracle_logs_created_at ON dlx_oracle_logs (created_at DESC);
