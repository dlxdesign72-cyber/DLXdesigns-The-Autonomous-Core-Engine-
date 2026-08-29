# Deployment & Webhook Blueprint

This document maps how to deploy DLX OS and integrate live webhooks and messaging layers.

1) Supabase
- Create a Supabase project and apply database/schema.sql.
- Create a service role key and keep it secret (used by backend and server-side Next.js APIs).
- Add a policy to allow inserts for trusted worker IPs or use RLS with service role.

2) Environment variables
- Set the variables from .env.example in your host (Vercel, Render, Fly, Railway): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, GEMINI_API_KEY, GEMINI_API_BASE_URL, GEMINI_MODEL

3) Backend (Hunter, Oracle)
- Deploy backend/worker as a scheduled job in your platform of choice (Vercel cron, Fly machines, or a small VM). Cron schedule: every 15 minutes.
- The worker will upsert leads into Supabase using the service role key.
- For serverless functions (backend/api/processLead.js), deploy as API route to handle manual or webhook-triggered lead processing.

4) Frontend (Next.js + Vercel)
- Deploy frontend/ to Vercel. Set environment variables including NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for the browser client and SUPABASE_SERVICE_ROLE_KEY for server-side API routes.
- Protect server-side APIs by validating an internal header or deploy them under serverless protected routes.

5) Webhooks & Messaging
- To notify owners or send automated messages, add a webhook connector in Supabase for inserts to dlx_verified_leads (via Supabase Functions or Realtime). Alternatively, the Hunter worker can call an external webhook on upsert.
- For messaging (WhatsApp/SMS), use a provider (e.g., Twilio, Gupshup) and store a webhook URL in environment variables. Ensure you honor rate limits and secure the provider keys.

6) Security
- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser. Use server-side APIs for privileged operations.
- Use environment variables in deployment platforms; rotate keys regularly.

7) Monitoring
- Add logging (pino) and error reporting (Sentry) to worker and serverless APIs.

8) Production checklist
- Review CORS rules on API endpoints
- Harden Supabase RLS if you use anon keys
- Add automated tests and health endpoints

