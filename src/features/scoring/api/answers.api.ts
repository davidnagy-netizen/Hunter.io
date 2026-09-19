import { httpClient } from "@/shared/api/httpClient";
import type { AnswerMap } from "../types/scoring.types";

export interface SaveAnswerResponse {
  success: true;
  key: string;
  value: AnswerMap[string] | null;
}

export const answersApi = {
  /**
   * `POST /api/opportunities/:id/answer`. The opportunity id only has to
   * exist — with `scope: "global"` the answer is stored against the bare
   * field and applies to every call that asks the same question. This is the
   * only endpoint that persists a signed-in account's answers server-side.
   */
  save: (oppId: string, field: string, value: AnswerMap[string] | null) =>
    httpClient
      .post<SaveAnswerResponse>(`/opportunities/${encodeURIComponent(oppId)}/answer`, { field, value, scope: "global" })
      .then((res) => res.data),
};
