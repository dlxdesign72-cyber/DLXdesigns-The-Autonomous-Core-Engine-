# Netlify deployment guide (staging)

This document explains how to deploy the frontend + API routes to Netlify safely for staging.

DO NOT set any production credentials in the repository. Only provide secrets via the Netlify UI.

1) Connect repository
- In Netlify, "Add new site" -> "Import an existing project" -> connect to GitHub and select this repository.
- When selecting the branch to deploy, choose `feature/production-integration` for your staging deploy.

2) Build settings
- Base directory: (leave empty) — build command will `cd` into frontend
- Build command: `cd frontend && npm ci --no-audit --no-fund && npm run build`
- Publish directory: `frontend/.next`
- Install the Netlify Next.js plugin in the site Plugins page (or Netlify will auto-detect `netlify.toml`).

3) Environment variables (set in Netlify Dashboard > Site settings > Build & deploy > Environment)
- Public (exposed to client bundle):
  - NEXT_PUBLIC_SUPABASE_URL = https://your-staging.supabase.co
  - NEXT_PUBLIC_SUPABASE_ANON_KEY = public-anon-key

- Server-only (mark as "protected" / do NOT add NEXT_PUBLIC_ prefix):
  - SUPABASE_URL = https://your-staging.supabase.co
  - SUPABASE_SERVICE_ROLE_KEY = <service-role-key>  # KEEP SECRET
  - INTERNAL_API_SECRET = <strong-random-secret>    # KEEP SECRET
  - GEMINI_API_KEY = <optional>                     # KEEP SECRET (only if using Oracle)
  - HUNTER_MAX_PAGES = 5                            # optional

Important: Do not set any service keys in client-visible variables. Only set NEXT_PUBLIC_* for public values.

4) Deploy
- Trigger a deploy via Netlify UI, or push a new commit to `feature/production-integration` to start a build.
- Watch the build logs; if the build fails, copy complete logs and paste them into the issue or chat for diagnosis.

5) Migrations (staging database)
- Create a staging Supabase project and obtain a database connection string.
- Backup any data before running migrations.
- Run the SQL in `database/schema.sql` and `database/migrations/2026-08-30-create-prospects-evidence.sql` against the staging DB only.
- Verify tables exist, run some smoke queries.

6) RLS policies
- Templates live in `database/policies/rls_templates.sql`. Adapt them to your auth setup and test in staging before applying to production.
- Steps:
  - Review and adapt policies in the template to your auth setup.
  - Test policies in staging with realistic JWT claims and service roles.

7) Worker (Hunter)
- Hunter is a background worker. Netlify functions are not a good long-running worker platform. Use Railway/Render/GitHub Actions or a small VM for scheduled work.
- Keep the worker's API keys strictly server-only.

8) Smoke tests
- After deploy, perform:
  - Visit the site — ensure no service role keys appear in the client bundle (search network JS for SUPABASE_SERVICE_ROLE_KEY).
  - Call server APIs (e.g., `/api/processLead`) with header `x-internal-secret: <INTERNAL_API_SECRET>` to verify ingestion.
  - Inspect staging Supabase tables for evidence rows and audit events.

9) Production rollout
- After staging is validated and backups/monitoring are in place, run the same migration in production during a maintenance window.
- Update Netlify production environment variables and trigger a production deployment.

10) CI trigger note
- Last CI trigger: 2026-09-04T07:56:00Z

If you want me to monitor the Netlify deploy logs directly, say "Monitor deploy" and provide the Netlify build log URL or grant me permission to view the site settings. I will inspect it and respond with exact fixes. Otherwise, paste the build logs and I will proceed.
