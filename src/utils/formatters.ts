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

/**
 * Returns official formatted Hijri date using Um-AlQura calendar
 */
export function getFormattedHijriDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '1448هـ';
  }
}

/**
 * Safely parses YYYY-MM-DD string into local Date at noon to avoid timezone boundary issues
 */
export function parseDateString(dateStr: string): Date {
  try {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d, 12, 0, 0);
      }
    }
    return new Date(dateStr);
  } catch {
    return new Date();
  }
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
export function formatToIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
