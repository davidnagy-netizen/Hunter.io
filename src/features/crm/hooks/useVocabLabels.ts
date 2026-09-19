import { useLang } from "@/shared/hooks/useFormat";
import { vocabLabel } from "../domain/vocabulary";
import type { Vocabulary } from "../types/crm.types";

/** Stage / lifecycle / source names in the active language, from the vocabulary the server sent with the data. */
export function useVocabLabels(vocabulary: Partial<Vocabulary> | undefined) {
  const lang = useLang();
  return {
    stage: (id: string | null | undefined) => vocabLabel(vocabulary?.stages, id, lang),
    lifecycle: (id: string | null | undefined) => vocabLabel(vocabulary?.lifecycles, id, lang),
    source: (id: string | null | undefined) => vocabLabel(vocabulary?.sources, id, lang),
    plan: (id: string | null | undefined) => vocabLabel(vocabulary?.plans, id, lang),
  };
}
