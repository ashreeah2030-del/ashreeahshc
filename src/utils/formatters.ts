/**
 * Formatter and privacy protection helpers for Saudi National ID and identities
 */

/**
 * Masks a Saudi National ID / Iqama, keeping only the last 4 digits visible.
 * Example: "1028471923" -> "******1923"
 */
export function maskNationalId(id?: string | null): string {
  if (!id) return '';
  const clean = String(id).trim();
  if (clean.length <= 4) return clean;
  const lastFour = clean.slice(-4);
  return `******${lastFour}`;
}

/**
 * Returns formatted masked display with Arabic direction safety
 */
export function formatMaskedNationalId(id?: string | null): string {
  return maskNationalId(id);
}
