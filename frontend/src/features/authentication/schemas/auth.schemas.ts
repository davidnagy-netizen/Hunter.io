import { z } from "zod";
import { isValidTaxNumber } from "../lib/taxNumber";

/** Mirrors the backend's username rule and minimum password length exactly. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;
export const MIN_PASSWORD_LENGTH = 4;

/**
 * The login form only checks fields are non-empty — the server's format rules
 * (username pattern, password length) apply to registration, not to login,
 * which instead answers with a single generic `BAD_CREDENTIALS` for any
 * mismatch. Client validation mirrors that: don't tell an attacker which half
 * of a guessed credential pair was wrong.
 */
export const loginSchema = z.object({
  username: z.string().min(1, "errors:LOGIN_REQUIRED"),
  password: z.string().min(1, "errors:LOGIN_REQUIRED"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Registration step 1: email, password and tax number — all the visitor
 * types. The company's name and address come from NAV, not from the visitor.
 * Consent to the terms and privacy notice is required and unticked by default;
 * marketing consent is a separate, optional box (CR-03: two separate consents).
 */
export const registerSchema = z.object({
  email: z.string().min(1, "errors:EMAIL_REQUIRED").email("errors:INVALID_EMAIL"),
  password: z.string().min(MIN_PASSWORD_LENGTH, "errors:WEAK_PASSWORD"),
  taxNumber: z.string().refine(isValidTaxNumber, "authentication:validation.taxNumber"),
  acceptTerms: z.boolean().refine((v) => v, "authentication:validation.terms"),
  marketingOptIn: z.boolean().optional(),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

/** Registration step 2: the username the account will be known by (prefilled from the email). */
export const usernameSchema = z.object({
  username: z.string().regex(USERNAME_PATTERN, "errors:INVALID_USERNAME"),
});
export type UsernameFormValues = z.infer<typeof usernameSchema>;

/**
 * A username to offer from an email address: the part before the `@`, cut down
 * to the characters a username may hold and to at most 32 of them, padded so it
 * reaches the 3-character minimum. The visitor can change it.
 */
export function suggestUsername(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 32);
  return cleaned.length >= 3 ? cleaned : (cleaned + "user").slice(0, Math.max(3, cleaned.length));
}
