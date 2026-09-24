/** CR-03: official Hungarian CDV; validate syntax before removing formatting. */
const SHAPE = /^(?:[0-9]{8}|[0-9]{11}|[0-9]{8}-[0-9]-[0-9]{2})$/;

export function taxDigits(raw: string): string { return raw.replace(/-/g, ""); }

/** The eighth digit complements the weighted sum to a multiple of ten. */
export function hasValidCheckDigit(raw: string): boolean {
  if (!SHAPE.test(raw)) return false;
  const digits = taxDigits(raw);
  const sum = [9, 7, 3, 1, 9, 7, 3].reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
  return (10 - sum % 10) % 10 === Number(digits[7]);
}

export function isValidTaxNumber(raw: string): boolean { return hasValidCheckDigit(raw.trim()); }

/** Progressive dash insertion preserves invalid pasted characters for validation feedback. */
export function formatTaxNumber(raw: string): string {
  raw = raw.trim();
  if (!/^[0-9-]*$/.test(raw)) return raw;
  const digits = taxDigits(raw);
  return digits.slice(0, 8) + (digits.length > 8 ? `-${digits.slice(8, 9)}` : "") + (digits.length > 9 ? `-${digits.slice(9)}` : "");
}
