import { httpClient } from "@/api/httpClient";
import type { AnswerMap, ScoredOpportunity } from "../types/scoring.types";

export interface SaveAnswerResponse {
  success: true;
  key: string;
  value: AnswerMap[string] | null;
  /** The call the question was asked on, re-scored with the new answer. */
  opportunity?: ScoredOpportunity;
}

export const answersApi = {
  /**
   * `POST /api/opportunities/:id/answer`. The opportunity id only has to
   * exist — with `scope: "global"` the answer is stored against the bare
   * field and applies to every call that asks the same question. This is the
   * only endpoint that persists a signed-in account's answers server-side.
   */
  save: (oppId: string, field: string, value: AnswerMap[string] | null, lang: string) =>
    httpClient
      .post<SaveAnswerResponse>(`/opportunities/${encodeURIComponent(oppId)}/answer`, { field, value, scope: "global" }, { params: { lang } })
      .then((res) => res.data),
};
