import fetch from 'node-fetch';
import cheerio from 'cheerio';
import pino from 'pino';
import { supabaseAdmin } from '../supabaseClient.js';

const logger = pino({ name: 'hunter' });

// Simple seed list of target URLs to sample intent signals from.
// In production, expand this to target marketplaces, social platforms (via APIs), and classifieds.
const TARGET_SOURCES = [
  {
    name: 'NaijaMarketplaceExample',
    url: 'https://example-listings.local/fashion/menswear',
    selector: '.listing',
  },
];

function extractIntentScoreFromText(text) {
  // Heuristic scorer: look for keywords and numeric indicators.
  const keywordsHigh = ['buy', 'order', 'urgent', 'ready to buy', 'need now'];
  const keywordsMedium = ['interested', 'price', 'how much', 'enquiry', 'inquire'];
  const lower = text.toLowerCase();
  let score = 1;
  for (const k of keywordsMedium) if (lower.includes(k)) score = Math.max(score, 5);
  for (const k of keywordsHigh) if (lower.includes(k)) score = Math.max(score, 8);
  // bump if phone-like or 'contact' found
  if (/(\+?\d[\d\s-]{6,})/.test(text)) score = Math.max(score, 7);
  return Math.min(10, score);
}

async function fetchPage(url) {
  const res = await fetch(url, { timeout: 20000 });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

export async function harvestFromSource(source, maxItems = 10) {
  logger.info({ source }, 'harvestFromSource');
  const html = await fetchPage(source.url);
  const $ = cheerio.load(html);
  const items = [];
  $(source.selector).slice(0, maxItems).each((i, el) => {
    const title = $(el).find('.title').text().trim() || $(el).text().trim().slice(0, 120);
    const phoneMatch = $(el).text().match(/(\+?\d[\d\s-]{6,})/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : null;
    const emailMatch = $(el).text().match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,6}/);
    const email = emailMatch ? emailMatch[0] : null;
    const intent_score = extractIntentScoreFromText($(el).text());
    items.push({
      full_name: $(el).find('.name').text().trim() || null,
      phone_number: phone,
      email,
      source_platform: source.name,
      intent_score,
      style_interest: $(el).find('.style').text().trim() || null,
      raw_intent_signal: { title }
    });
  });
  return items;
}

export async function upsertLeadToSupabase(lead) {
  const row = {
    full_name: lead.full_name,
    phone_number: lead.phone_number,
    email: lead.email,
    source_platform: lead.source_platform,
    intent_score: lead.intent_score || 1,
    style_interest: lead.style_interest,
    raw_intent_signal: lead.raw_intent_signal || {},
    lead_status: lead.lead_status || 'new'
  };

  // Upsert using phone_number as unique key
  const { data, error } = await supabaseAdmin
    .from('dlx_verified_leads')
    .upsert(row, { onConflict: ['phone_number'], returning: 'representation' });

  if (error) {
    logger.error({ err: error }, 'Failed to upsert lead');
    throw error;
  }
  logger.info({ phone: row.phone_number }, 'Upserted lead');
  return data;
}

// Worker entry for a single run
export async function runHunter({ maxPages = 3 } = {}) {
  for (const source of TARGET_SOURCES) {
    try {
      const items = await harvestFromSource(source, maxPages);
      for (const item of items) {
        if (!item.phone_number && !item.email) continue; // ignore uncontactable
        try {
          await upsertLeadToSupabase(item);
        } catch (err) {
          logger.warn({ err: err.message }, 'upsert failed for item');
        }
      }
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
