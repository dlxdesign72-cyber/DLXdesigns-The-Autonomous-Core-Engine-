# Database migrations

This document describes how to safely validate and run database migrations for this project.

1) Overview
- Migration files are stored in database/migrations/ and are additive (use CREATE TABLE IF NOT EXISTS).
- Before applying migrations to staging or production, validate them and run in a controlled maintenance window.

2) Local verification (no DB access required)
- Run the migration checker to ensure migration files exist and appear valid SQL:

  node scripts/check-migrations.js

3) Running migrations in staging/production
- DO NOT run migrations directly from CI without backups and a rollback plan.
- Recommended flow:
  a) Take a database backup/snapshot.
  b) Run migrations in staging and run smoke tests.
  c) Schedule a maintenance window for production migration if necessary.
  d) Apply migrations using your preferred tool (psql, supabase CLI, or managed DB migration tooling).

4) RLS (Row Level Security)
- RLS templates are included at database/policies/rls_templates.sql. These are templates and must be adapted for your auth roles and JWT claims.
- Steps:
  - Review and adapt policies in the template to your auth setup.
  - Test policies in staging with realistic JWT claims and service roles.

5) Rollbacks
- Because migrations are non-destructive in this repo, rollbacks should be straightforward. However, if you ever introduce destructive changes, ensure a tested rollback path exists.

6) Contact
- If you need assistance applying migrations, provide staging DB credentials to the operator running them (never commit credentials into the repo).
