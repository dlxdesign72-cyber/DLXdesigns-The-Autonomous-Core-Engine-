import fetch from 'node-fetch';
import pino from 'pino';
import { normalizePhone, normalizeEmail } from '../lib/normalize.js';
import { processLeadPayload } from '../services/processLeadService.js';

const logger = pino({ name: 'connector-generic' });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function createPayloadFromEntry(entry, sourceName = 'GenericFeed') {
  return {
    source: sourceName,
    source_url: entry.url || null,
    captured_at: entry.published_at || entry.date || new Date().toISOString(),
    raw_signal: { title: entry.title || entry.description || null },
    evidence_type: 'listing',
    provenance: 'HUNTER_DISCOVERED',
    contact: { phone: entry.phone || entry.contact_phone || null, email: entry.email || entry.contact_email || null },
    product_interest: entry.interest || entry.category || null,
    location: entry.location || null,
  };
}

export async function fetchJsonFeed(url, opts = {}) {
  const attempts = opts.attempts || 3;
  const backoff = opts.backoff || 500;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { timeout: opts.timeout || 10000 });
      if (!res.ok) throw new Error(`fetch failed ${res.status}`);
      const json = await res.json();
      return json;
    } catch (err) {
      logger.warn({ err: err.message, attempt: i + 1 }, 'fetch attempt failed');
      if (i + 1 < attempts) await sleep(backoff * (i + 1));
      else throw err;
    }
  }
}

export async function runGenericConnector({ process = false, feedUrl = process.env.CONNECTOR_FEED_URL, sourceName = process.env.CONNECTOR_SOURCE_NAME || 'GenericFeed' } = {}) {
  if (!feedUrl) {
    logger.warn('CONNECTOR_FEED_URL not configured; connector disabled');
    return;
  }
  // Connector enabled only when CONNECTOR_ENABLED=1
  if (process.env.CONNECTOR_ENABLED !== '1') {
    logger.info('Connector disabled by feature flag CONNECTOR_ENABLED');
    return;
  }

  const json = await fetchJsonFeed(feedUrl);
  const items = Array.isArray(json) ? json : (json.items || json.results || []);
  logger.info({ count: items.length, source: sourceName }, 'fetched feed items');

  // process sequentially with small delay to avoid rapid-fire requests
  for (const it of items) {
    const payload = createPayloadFromEntry(it, sourceName);
    const normPhone = normalizePhone(payload.contact.phone);
    const normEmail = normalizeEmail(payload.contact.email);
    logger.info({ title: payload.raw_signal?.title, phone: normPhone, email: normEmail }, 'mapped entry');

    if (process) {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        logger.warn('SUPABASE_SERVICE_ROLE_KEY not configured; skipping processing');
        continue;
      }
      try {
        await processLeadPayload(payload, `connector:${sourceName}`);
        logger.info('processed entry');
      } catch (err) {
        logger.error({ err: err.message }, 'failed to process entry');
      }
    }

    // small delay between items to be gentle
    await sleep(300);
  }
}

if (process.argv.includes('--run')) {
  const run = process.argv.includes('--process');
  runGenericConnector({ process: run }).catch(err => { console.error(err); process.exit(2); });
}
