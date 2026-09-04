// Hunter integration template
// This file is a template demonstrating how to safely add an API acquisition source.
// Do NOT enable any source here without explicit authorization and credentials.

import pino from 'pino';
import { processLeadPayload } from '../services/processLeadService.js';

const logger = pino({ name: 'hunter-template' });

// Example feature-flag driven configuration
const SOURCE_CONFIG = {
  SomePublicAPI: {
    enabled: process.env.HUNTER_ENABLE_SOMEPUBLICAPI === '1',
    kind: 'api',
    url: process.env.SOMEPUBLICAPI_URL || '',
    apiKeyEnv: 'SOMEPUBLICAPI_KEY',
    mapping: (item) => ({
      source: 'SomePublicAPI',
      source_url: item.url || null,
      captured_at: item.published_at || new Date().toISOString(),
      raw_signal: item,
      evidence_type: 'listing',
      provenance: 'HUNTER_DISCOVERED',
      contact: { phone: item.phone || null, email: item.email || null },
      product_interest: item.interest || null,
      location: item.location || null,
    }),
  }
};

export async function runHunterTemplate() {
  for (const [name, cfg] of Object.entries(SOURCE_CONFIG)) {
    if (!cfg.enabled) {
      logger.info({ name }, 'source disabled by feature flag');
      continue;
    }
    const key = process.env[cfg.apiKeyEnv];
    if (!key) {
      logger.warn({ name }, 'source enabled but API key missing; skipping');
      continue;
    }
    try {
      const res = await fetch(cfg.url, { headers: { Authorization: `Bearer ${key}` }, timeout: 20000 });
      if (!res.ok) throw new Error(`API ${name} returned ${res.status}`);
      const json = await res.json();
      const items = json.items || json.results || [];
      for (const it of items) {
        const payload = cfg.mapping(it);
        if (!payload.contact.phone && !payload.contact.email) continue; // skip uncontactable
        try {
          await processLeadPayload(payload, 'hunter-template');
        } catch (err) {
          logger.warn({ err: err.message }, 'Failed to process payload');
        }
      }
    } catch (err) {
      logger.error({ err: err.message }, 'source fetch failed');
    }
  }
}
