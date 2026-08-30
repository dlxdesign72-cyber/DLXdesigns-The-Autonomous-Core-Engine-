import { z } from 'zod';

// Deterministic qualification engine
// Input: evidence object which MAY contain raw_signal.intent_score (numeric) and product_interest

export function qualifyFromEvidence(evidence) {
  // Basic structure
  const intent = (evidence?.raw_signal?.intent_score) ? Number(evidence.raw_signal.intent_score) : null;
  const recencyDays = evidence?.captured_at ? ( (Date.now() - new Date(evidence.captured_at).getTime()) / (1000*60*60*24) ) : null;

  // Hard disqualifiers
  const hasContact = !!(evidence?.raw_signal?.contact?.phone || evidence?.raw_signal?.contact?.email || evidence.prospect_contact_present);
  const explicitNotInterested = (String(evidence?.raw_signal?.note || '').toLowerCase().includes('not interested') || String(evidence?.raw_signal?.note || '').toLowerCase().includes('no thanks'));
  if (!hasContact) return { approved: false, score: 0, tier: 'Rejected', reason: 'No contact information (hard disqualifier)', model: 'deterministic-v1' };
  if (explicitNotInterested) return { approved: false, score: 0, tier: 'Rejected', reason: 'Explicit negative signal in evidence', model: 'deterministic-v1' };

  // Base score
  let score = 0;
  if (intent !== null) score += Math.max(0, Math.min(10, intent));
  // recency weighting
  if (recencyDays !== null) {
    if (recencyDays < 3) score += 2;
    else if (recencyDays < 14) score += 1;
  }
  // product interest heuristic
  if (evidence?.raw_signal?.product_interest) score += 1;

  // Cap
  score = Math.min(20, score);

  // Tier mapping
  let tier = 'Bronze';
  if (score >= 12) tier = 'Gold';
  else if (score >= 7) tier = 'Silver';

  const approved = score >= 7;
  const reason = `Deterministic scoring: intent=${intent}, recencyDays=${recencyDays ? Math.round(recencyDays) : 'n/a'}, product_interest=${Boolean(evidence?.raw_signal?.product_interest)}`;
  return { approved, score, tier, reason, model: 'deterministic-v1' };
}
