import { z } from 'zod';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { normalizePhone, normalizeEmail } from '../lib/normalize.js';

const EvidenceSchema = z.object({
  source: z.string(),
  source_url: z.string().url().optional(),
  captured_at: z.string().optional(),
  raw_signal: z.any(),
  evidence_type: z.string().optional(),
  provenance: z.enum(['HUNTER_DISCOVERED', 'EXTERNALLY_SUPPLIED']),
  contact: z.object({ phone: z.string().optional(), email: z.string().optional() }).optional(),
  product_interest: z.string().optional(),
  location: z.any().optional()
});

export async function processLeadPayload(payload, actor = 'system') {
  // Validate
  const parsed = EvidenceSchema.parse(payload);

  // Normalize contact
  const phone = parsed.contact?.phone ? normalizePhone(parsed.contact.phone) : null;
  const email = parsed.contact?.email ? normalizeEmail(parsed.contact.email) : null;

  // Deduplicate: try find prospect by normalized phone or email
  let prospect = null;
  if (phone) {
    const { data: byPhone } = await supabaseAdmin
      .from('prospects')
      .select('*')
      .eq('normalized_phone', phone)
      .limit(1);
    if (byPhone && byPhone.length) prospect = byPhone[0];
  }
  if (!prospect && email) {
    const { data: byEmail } = await supabaseAdmin
      .from('prospects')
      .select('*')
      .eq('normalized_email', email)
      .limit(1);
    if (byEmail && byEmail.length) prospect = byEmail[0];
  }

  // If not found, create prospect
  let createdProspect = null;
  let matched = false;
  if (!prospect) {
    const newProspect = {
      full_name: payload.full_name || null,
      phone_number: parsed.contact?.phone || null,
      normalized_phone: phone,
      email: parsed.contact?.email || null,
      normalized_email: email,
      product_interest: parsed.product_interest || null,
      location: parsed.location || null,
      current_stage: 'NEW'
    };
    const { data, error } = await supabaseAdmin.from('prospects').insert(newProspect).select('*');
    if (error) throw error;
    createdProspect = data?.[0] || null;
    prospect = createdProspect;
  } else {
    matched = true;
  }

  // Insert evidence
  const evidenceRow = {
    prospect_id: prospect.id,
    source: parsed.source,
    source_url: parsed.source_url || null,
    captured_at: parsed.captured_at ? parsed.captured_at : new Date().toISOString(),
    raw_signal: parsed.raw_signal || null,
    evidence_type: parsed.evidence_type || null,
    provenance: parsed.provenance
  };
  const { data: evidenceData, error: evidenceError } = await supabaseAdmin.from('evidence').insert(evidenceRow).select('*');
  if (evidenceError) throw evidenceError;
  const evidence = evidenceData?.[0];

  // Create audit event
  await supabaseAdmin.from('audit_events').insert({ actor, action: 'process_lead', payload: payload, created_at: new Date().toISOString() });

  return { prospect, evidence, matched };
}
