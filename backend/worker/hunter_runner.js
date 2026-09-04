import { fetchTestItems } from './hunter_test_source.js';
import { normalizePhone, normalizeEmail } from '../lib/normalize.js';
import pino from 'pino';
import { processLeadPayload } from '../services/processLeadService.js';

const logger = pino({ name: 'hunter-runner' });

export function createPayloadFromItem(it) {
  return {
    source: 'TestFeed',
    source_url: it.url || null,
    captured_at: it.published_at || new Date().toISOString(),
    raw_signal: { title: it.title },
    evidence_type: 'listing',
    provenance: 'HUNTER_DISCOVERED',
    contact: { phone: it.phone || null, email: it.email || null },
    product_interest: it.interest || null,
    location: it.location || null
  };
}

export async function runHunterLocal({ process = false } = {}) {
  const items = await fetchTestItems();
  logger.info({ count: items.length }, 'fetched test items');
  for (const it of items) {
    const payload = createPayloadFromItem(it);
    // show normalized contact
    const normPhone = normalizePhone(payload.contact.phone);
    const normEmail = normalizeEmail(payload.contact.email);
    logger.info({ id: it.id, phone: normPhone, email: normEmail }, 'mapped payload');

    if (process) {
      // Only call processLeadPayload when service key is configured and user explicitly asks to process.
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        logger.warn('SUPABASE_SERVICE_ROLE_KEY not configured; skipping processing');
        continue;
      }
      try {
        await processLeadPayload(payload, 'hunter-local');
        logger.info({ id: it.id }, 'processed payload');
      } catch (err) {
        logger.error({ err: err.message }, 'failed to process payload');
      }
    }
  }
}

if (process.argv.includes('--run')) {
  const run = process.argv.includes('--process');
  runHunterLocal({ process: run }).catch(err => { console.error(err); process.exit(2); });
}
