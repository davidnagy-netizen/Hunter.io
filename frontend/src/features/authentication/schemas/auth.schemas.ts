import { z } from "zod";

/** Login accepts existing usernames and new email identifiers without imposing signup policy. */
export const loginSchema = z.object({
  username: z.string().min(1, "errors:LOGIN_REQUIRED"),
  password: z.string().min(1, "errors:LOGIN_REQUIRED"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

/** CR-03 credentials and independent consent controls; passwords must match server validation. */
export const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(12).max(128),
  password_confirmation: z.string(),
  accept_terms: z.boolean().refine(Boolean),
  accept_privacy: z.boolean().refine(Boolean),
  marketing_opt_in: z.boolean(),
}).refine(v => v.password === v.password_confirmation, { path: ["password_confirmation"], message: "Passwords must match" });
export type RegisterFormValues = z.infer<typeof registerSchema>;