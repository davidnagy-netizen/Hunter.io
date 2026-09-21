/**
 * Hungarian tax numbers (adószám): 8 digits (the base), or `xxxxxxxx-y-zz`
 * (base, VAT code, county), typed with or without the dashes. The same rules
 * as the backend's `ValidateTaxpayerRequest`, so a number that passes here is
 * never refused by the server for its shape; the server stays the authority.
 */
const SHAPE = /^(\d{8}|\d{8}-\d-\d{2}|\d{11})$/;
const WEIGHTS = [9, 7, 3, 1, 9, 7, 3];

export function taxDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** The eighth digit must equal the weighted sum of the first seven, modulo 10. */
export function hasValidCheckDigit(raw: string): boolean {
  const digits = taxDigits(raw);
  if (digits.length < 8) return false;
  const sum = WEIGHTS.reduce((total, weight, i) => total + Number(digits[i]) * weight, 0);
  return sum % 10 === Number(digits[7]);
}

export function isValidTaxNumber(raw: string): boolean {
  const value = raw.trim();
  return SHAPE.test(value) && hasValidCheckDigit(value);
}

/** `12345674242` → `12345674-2-42`; a bare base or a half-typed number is returned as typed. */
export function formatTaxNumber(raw: string): string {
  const digits = taxDigits(raw);
  return digits.length === 11 ? `${digits.slice(0, 8)}-${digits[8]}-${digits.slice(9)}` : raw.trim();
}
