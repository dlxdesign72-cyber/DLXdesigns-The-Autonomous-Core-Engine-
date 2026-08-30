import { z } from 'zod';
import { processLeadPayload } from '../services/processLeadService.js';

// Serverless handler for processing incoming evidence/prospects
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-internal-secret'] || req.headers['internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = req.body || (await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(JSON.parse(d))); }));
    const result = await processLeadPayload(body, 'api');
    res.status(200).json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
}
