export function normalizePhone(raw) {
  if (!raw) return null;
  // Strip non-digits and leading plus
  const digits = raw.replace(/[^\d+]/g, '');
  let s = digits;
  // If starts with + keep, else treat local formats
  if (s.startsWith('+')) return s;
  // Remove leading zeros/spaces
  s = s.replace(/^0+/, '');
  // If length 10 (Nigerian local without 0), prefix +234
  if (s.length === 10) return `+234${s}`;
  // If starts with 234 and length 13 (234XXXXXXXXXX), add +
  if (s.startsWith('234')) return `+${s}`;
  // Fallback: return digits-only with +
  return `+${s}`;
}

export function normalizeEmail(raw) {
  if (!raw) return null;
  return raw.trim().toLowerCase();
}
