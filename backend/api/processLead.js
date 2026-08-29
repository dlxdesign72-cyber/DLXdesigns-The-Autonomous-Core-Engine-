import { z } from 'zod';
import { generateMorningBriefing } from '../oracle/oracleHandler.js';

// Example serverless handler to be used on Vercel or Netlify functions
export async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = JSON.parse(req.body || '{}');
    const schema = z.object({ date: z.string().optional(), sampleLeads: z.number().int().min(1).max(50).optional() });
    const { date, sampleLeads } = schema.parse(body);
    const result = await generateMorningBriefing({ date, sampleLeads });
    res.status(200).json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}
