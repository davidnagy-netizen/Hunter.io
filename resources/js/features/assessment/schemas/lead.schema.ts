import { z } from "zod";

/**
 * The follow-up request. Messages are i18n keys in the shared `errors`
 * namespace — the same wording the server uses when it rejects a lead
 * (`validateLead` in `server/crm.js`), so client and server agree.
 */
export const leadSchema = z.object({
  email: z.string().trim().min(1, "errors:EMAIL_REQUIRED").email("errors:INVALID_EMAIL"),
  company: z.string().optional(),
  contactName: z.string().optional(),
  consent: z.boolean().refine((v) => v === true, "errors:CONSENT_REQUIRED"),
});
export type LeadFormValues = z.infer<typeof leadSchema>;
