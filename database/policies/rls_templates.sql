-- RLS templates for Supabase/Postgres
-- These are templates and MUST be adapted to your roles and policies before applying in production.

-- Example: enable RLS on prospects and allow only authenticated service role to insert
-- NOTE: DO NOT apply blindly in production without testing in staging.

-- Enable RLS on prospects
ALTER TABLE IF EXISTS prospects ENABLE ROW LEVEL SECURITY;

-- Allow a server role (e.g., service_role) to bypass policies. Replace 'service_role' with your DB role.
-- CREATE POLICY "service_role_full_access" ON prospects
--   USING (current_setting('request.jwt.claims.role', true) = 'service_role')
--   WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');

-- Template: allow inserts from server using a check on a custom claim or function
-- CREATE POLICY "server_insert_prospects" ON prospects
--   FOR INSERT
--   TO authenticated
--   USING (true)
--   WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');

-- Audit events: append-only
ALTER TABLE IF EXISTS audit_events ENABLE ROW LEVEL SECURITY;
-- Create policy allowing inserts from server (example template)
-- CREATE POLICY "server_insert_audit" ON audit_events
--   FOR INSERT
--   TO authenticated
--   USING (true)
--   WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');

-- Evidence: only server may insert evidence with provenance
ALTER TABLE IF EXISTS evidence ENABLE ROW LEVEL SECURITY;
-- Example check to ensure provenance is set by server
-- CREATE POLICY "server_insert_evidence" ON evidence
--   FOR INSERT
--   TO authenticated
--   USING (true)
--   WITH CHECK (provenance IN ('HUNTER_DISCOVERED', 'EXTERNALLY_SUPPLIED') AND current_setting('request.jwt.claims.role', true) = 'service_role');

-- NOTE: Replace templates above with real policies tailored to your auth setup. Test thoroughly in staging.
