import { useCallback } from "react";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { useServerProfileQuery } from "@/features/profile/api/profile.queries";
import { useSaveAnswerMutation } from "../api/answers.queries";
import { useLocalAnswersStore } from "../store/localAnswersStore";
import type { AnswerMap } from "../types/scoring.types";

const NO_ANSWERS: AnswerMap = {};

/**
 * The eligibility answers for whoever is looking: the server's copy for a
 * signed-in account (so they follow the user across devices — the legacy app
 * never wrote them server-side), the browser's own for an anonymous visitor.
 * Same fork as `useCompanyProfile`.
 */
export function useEligibilityAnswers() {
  const isAuthenticated = useIsAuthenticated();
  const serverProfile = useServerProfileQuery(isAuthenticated);
  const localAnswers = useLocalAnswersStore((state) => state.answers);
  const setLocalAnswer = useLocalAnswersStore((state) => state.setAnswer);
  const saveAnswer = useSaveAnswerMutation();

  const answers: AnswerMap = isAuthenticated
    ? ((serverProfile.data?.answers as AnswerMap | undefined) ?? NO_ANSWERS)
    : localAnswers;

  /** `oppId` only anchors the request; the answer is stored per company, not per call. */
  const answerQuestion = useCallback(
    async (oppId: string, field: string, value: AnswerMap[string] | null) => {
      if (isAuthenticated) {
        await saveAnswer.mutateAsync({ oppId, field, value });
      } else {
        setLocalAnswer(field, value);
      }
    },
    [isAuthenticated, saveAnswer, setLocalAnswer],
  );

  return { answers, answerQuestion, isSaving: saveAnswer.isPending };
}
