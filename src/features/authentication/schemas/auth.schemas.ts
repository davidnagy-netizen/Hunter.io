import { z } from "zod";

/** Mirrors `USERNAME_RE`/`MIN_PASSWORD` in `server/auth.js` exactly. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;
export const MIN_PASSWORD_LENGTH = 4;

/**
 * The login form only checks fields are non-empty — the server's
 * `validateCredentials()` format rules (username pattern, password length)
 * apply to registration and password-change, not to login, which instead
 * answers with a single generic `BAD_CREDENTIALS` for any mismatch. Client
 * validation mirrors that: don't tell an attacker which half of a guessed
 * credential pair was wrong.
 */
export const loginSchema = z.object({
  username: z.string().min(1, "errors:LOGIN_REQUIRED"),
  password: z.string().min(1, "errors:LOGIN_REQUIRED"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().regex(USERNAME_PATTERN, "errors:INVALID_USERNAME"),
  password: z.string().min(MIN_PASSWORD_LENGTH, "errors:WEAK_PASSWORD"),
  company: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("errors:INVALID_EMAIL")]).optional(),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;
