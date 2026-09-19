import type { Lang } from "@/shared/lib/format";
import type { NoteKind, VocabEntry } from "../types/crm.types";

export const NOTE_KINDS = ["note", "call", "email", "meeting", "decision"] as const satisfies readonly NoteKind[];

/** A vocabulary entry's label in the given language; an id the server no longer lists is shown as-is, and no id as a dash. */
export function vocabLabel(list: VocabEntry[] | undefined, id: string | null | undefined, lang: Lang): string {
  if (!id) return "—";
  const entry = list?.find((e) => e.id === id);
  if (!entry) return id;
  return (lang === "en" ? entry.label_en || entry.label_hu : entry.label_hu || entry.label_en) || id;
}
