# Hunter connector & test

This folder adds a safe test feed and a local hunter runner to validate connector mapping without touching the database.

Files:
- backend/worker/test_feed.json: test data for the connector
- backend/worker/hunter_test_source.js: loader for the test feed
- backend/worker/hunter_runner.js: mapping and optional processing runner
- backend/test/hunter.test.js: unit test validating mapping and normalization

Usage:
- Run the unit test:
  cd backend
  node test/hunter.test.js

- Run the local hunter runner in dry-run mode:
  node backend/worker/hunter_runner.js --run

- To actually process leads (ONLY if you have SUPABASE_SERVICE_ROLE_KEY configured in env):
  node backend/worker/hunter_runner.js --run --process
