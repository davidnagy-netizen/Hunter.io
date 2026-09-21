import { z } from "zod";
import { NOTE_KINDS } from "../domain/vocabulary";

/** Messages are i18n keys, resolved where the error is rendered. */
export const noteSchema = z.object({
  text: z.string().trim().min(1, "crm:validation.note").max(4000, "crm:validation.note"),
  kind: z.enum(NOTE_KINDS),
});
export type NoteFormValues = z.infer<typeof noteSchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "crm:validation.task").max(200, "crm:validation.task"),
  /** `YYYY-MM-DD` from a date input; empty means no due date. */
  dueAt: z.string(),
});
export type TaskFormValues = z.infer<typeof taskSchema>;

export const classificationSchema = z.object({
  owner: z.string().trim().max(60, "crm:validation.owner"),
  /** Comma-separated; split by `parseTags` on submit. */
  tags: z.string(),
});
export type ClassificationFormValues = z.infer<typeof classificationSchema>;
