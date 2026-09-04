# Generic Connector

This connector fetches a configurable JSON feed (CONNECTOR_FEED_URL) and maps items to the internal processLeadPayload shape.

Configuration (env):
- CONNECTOR_ENABLED=1 to enable the connector
- CONNECTOR_FEED_URL set to a public JSON feed URL (or data: URL for local testing)
- CONNECTOR_SOURCE_NAME optional friendly name

Usage:
- Dry-run (no DB writes):
  node backend/worker/connector_generic.js --run

- Process into staging DB (ONLY with SUPABASE_SERVICE_ROLE_KEY set):
  export SUPABASE_SERVICE_ROLE_KEY="<staging service key>"
  export CONNECTOR_ENABLED=1
  export CONNECTOR_FEED_URL="https://example.test/feed.json"
  node backend/worker/connector_generic.js --run --process

Testing:
- npm run test (run from backend) will include connector tests.
