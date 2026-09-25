import { useCallback } from "react";
import { useIsAuthenticated } from "@/shared/hooks/useAuth";
import { useServerProfileQuery } from "@/shared/api/profile.queries";
import { useSaveAnswerMutation } from "../api/answers.queries";
import type { AnswerMap } from "../types/scoring.types";

const NO_ANSWERS: AnswerMap = {};

/**
 * A signed-in account's eligibility answers, held by the server (so they
 * follow the user across devices). Questions are only ever shown on a call's
 * detail page, which needs a subscription, so there is no anonymous case.
 */
export function useEligibilityAnswers() {
  const isAuthenticated = useIsAuthenticated();
  const serverProfile = useServerProfileQuery(isAuthenticated);
  const saveAnswer = useSaveAnswerMutation();

  const answers = (serverProfile.data?.answers as AnswerMap | undefined) ?? NO_ANSWERS;

  /** `oppId` only anchors the request; the answer is stored per company, not per call. */
  const answerQuestion = useCallback(
    async (oppId: string, field: string, value: AnswerMap[string] | null) => {
      await saveAnswer.mutateAsync({ oppId, field, value });
    },
    [saveAnswer],
  );

  return { answers, answerQuestion, isSaving: saveAnswer.isPending };
}
