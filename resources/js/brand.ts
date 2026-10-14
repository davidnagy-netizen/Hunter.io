/**
 * The product's name, in one place, for the few spots in code that print it
 * (the logo's alt text, the sign-in header, a score label). Translated copy lives in
 * the locale files and says "Fundor" literally — `brand.test.ts` fails if the
 * old name creeps back into either. (Renamed from Hunter, 2026-09-20; the
 * domain is fundor.hu.)
 */
export const BRAND = {
  name: "Fundor",
  domain: "fundor.hu",
} as const;
