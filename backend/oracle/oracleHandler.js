import fetch from 'node-fetch';
import { supabaseAdmin } from '../supabaseAdmin.js';

// Gemini configuration is evaluated lazily. Importing this module does not require GEMINI_API_KEY.
function getGeminiConfig() {
  return {
    key: process.env.GEMINI_API_KEY,
    base: process.env.GEMINI_API_BASE_URL || 'https://generativeapi.example.com/v1',
    model: process.env.GEMINI_MODEL || 'text-bison-001',
  };
}

function requireGemini() {
  const cfg = getGeminiConfig();
  if (!cfg.key) {
    throw new Error('Gemini API key not configured (GEMINI_API_KEY). Gemini operations are disabled until configured.');
  }
  return cfg;
}

export async function callOracle(prompt) {
  const { key, base, model } = requireGemini();
  const url = `${base}/models/${model}:generate`;
  const body = {
    prompt: typeof prompt === 'string' ? { text: prompt } : prompt,
    temperature: 0.2,
    maxOutputTokens: 800,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Oracle call failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  const text = json?.output?.[0]?.content?.[0]?.text || json?.candidates?.[0]?.content || json?.result || JSON.stringify(json);
  return { raw: json, text };
}

export async function generateMorningBriefing({ date = new Date().toISOString().slice(0, 10), sampleLeads = 10 } = {}) {
  // Pull high-intent recent leads — this uses the server-side admin client and will throw if server envs are missing
  const { data: leads } = await supabaseAdmin
    .from('dlx_verified_leads')
    .select('full_name,phone_number,email,intent_score,source_platform,style_interest,raw_intent_signal,created_at')
    .order('intent_score', { ascending: false })
    .limit(sampleLeads);

  const shortLeadSummary = (leads || []).
    map(l => `- ${l.full_name || '(no name)'} | ${l.phone_number || l.email || 'no-contact'} | intent:${l.intent_score} | source:${l.source_platform || 'unknown'}`)
    .join('\n');

  const prompt = `You are The Oracle for DLX Designs (Lagos menswear). Today is ${date}.

Here are recent high-intent leads:\n${shortLeadSummary}\n\nPlease provide:\n1) Executive morning briefing (3 short bullets) focused on Lagos trends: Senator, Agbada, wedding season surges.\n2) Competitor/market signals to watch (3 items).\n3) 3 actionable recommendations for the brand owner (sales or messaging).\nReturn results as JSON with keys: market_trend_summary, competitor_analysis, actionable_recommendation.`;

  const resp = await callOracle(prompt);
  const market_trend_summary = resp.text;

  const insert = await supabaseAdmin
    .from('dlx_oracle_logs')
    .insert({ briefing_date: date, market_trend_summary, competitor_analysis: null, actionable_recommendation: null, raw_response: resp.raw })
    .select('*');

  return { resp: resp.raw, text: market_trend_summary, saved: insert.data };
}
