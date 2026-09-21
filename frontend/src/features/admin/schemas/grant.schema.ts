import { z } from "zod";

/**
 * The per-user "grant access" form. `days` overrides the plan's own length
 * and is optional — the server falls back to the plan's when it is absent.
 * Messages are i18n keys, resolved where the error is rendered.
 */
export const grantSchema = z.object({
  planId: z.string().min(1, "admin:validation.plan"),
  days: z.number("admin:validation.days").int("admin:validation.days").positive("admin:validation.days").optional(),
  note: z.string().trim().max(200, "admin:validation.note").optional(),
});

export type GrantFormValues = z.infer<typeof grantSchema>;
