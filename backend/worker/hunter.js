import pino from 'pino';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { processLeadPayload } from '../services/processLeadService.js';

const logger = pino({ name: 'hunter' });

// Config-driven sources: list sources and their kind. Unsupported sources must be explicitly marked.
const TARGET_SOURCES = [
  // Example: unsupported marketplace (marked unsupported so Hunter will skip and log)
  { name: 'NaijaMarketplaceExample', kind: 'unsupported', note: 'No public API; scraping not permitted' },
  // To enable a real API source, add an entry like:
  // { name: 'SomePublicAPI', kind: 'api', url: 'https://api.example.com/listings', mapping: {...} }
];

export async function runHunter({ maxPages = 3 } = {}) {
  for (const source of TARGET_SOURCES) {
    try {
      if (source.kind === 'unsupported') {
        logger.info({ source: source.name, note: source.note }, 'Source unsupported — skipping');
        continue;
      }

      if (source.kind === 'api') {
        // Example API integration: must be provided/implemented per source
        const res = await fetch(source.url, { timeout: 20000 });
        if (!res.ok) throw new Error(`API ${source.name} returned ${res.status}`);
        const json = await res.json();
        // Map JSON items to structured evidence — mapping must be implemented per-source
        const items = (json.items || json.results || []);
        for (const it of items.slice(0, maxPages)) {
          // Build structured payload
          const payload = {
            source: source.name,
            source_url: it.url || null,
            captured_at: it.published_at || new Date().toISOString(),
            raw_signal: it,
            evidence_type: 'listing',
            provenance: 'HUNTER_DISCOVERED',
            contact: { phone: it.phone || null, email: it.email || null },
            product_interest: it.interest || null,
            location: it.location || null
          };
          // Only process if contact info exists
          if (!payload.contact.phone && !payload.contact.email) continue;
          try {
            await processLeadPayload(payload, 'hunter');
          } catch (err) {
            logger.warn({ err: err.message }, 'Failed to process hunter payload');
          }
        }
        continue;
      }

      if (source.kind === 'scrape') {
        // Scraping is allowed only if source provides a public endpoint and scraping is permitted by TOS.
        // If not, mark as unsupported above. Implement scraping only with explicit confirmation.
        logger.info({ source: source.name }, 'Scrape kind is configured but not implemented — skipping to avoid accidental scraping');
        continue;
      }

      logger.info({ source: source.name }, 'Unknown source kind — skipping');
    } catch (err) {
      logger.error({ err: err.message, source }, 'source harvest failed');
    }
  }
}

// CLI-run
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const max = parseInt(process.env.HUNTER_MAX_PAGES || '3', 10);
    await runHunter({ maxPages: max });
    process.exit(0);
  })();
}
