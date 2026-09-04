import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(raw) {
  if (!raw) return null;
  try {
    // Try to parse with a reasonable default country (NG) for local numbers
    const pn = parsePhoneNumberFromString(raw, 'NG');
    if (pn && pn.isValid && pn.isValid()) {
      return pn.number; // E.164 format
    }
  } catch (err) {
    // fallthrough to fallback normalization
  }

  // Fallback: strip non-digits and ensure a + prefix
  const digits = String(raw).replace(/[^\d]/g, '');
  if (!digits) return null;
  // If looks like it already contains country code (e.g., starts with 234 and length reasonable), prefix +
  if (digits.length >= 11) return `+${digits}`;
  // If short (e.g., local 10-digit), heuristically assume NG +234
  if (digits.length === 10) return `+234${digits}`;
  return `+${digits}`;
}

export function normalizeEmail(raw) {
  if (!raw) return null;
  return String(raw).trim().toLowerCase();
}
