import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/features/profile/api/profile.queries";
import type { GetProfileResponse } from "@/features/profile/types/profile.types";
import { opportunitiesKeys } from "@/api/opportunitiesKeys";
import { useLang } from "@/composables/useFormat";
import { answersApi } from "./answers.api";
import type { AnswerMap } from "../types/scoring.types";

interface SaveAnswerVariables {
  oppId: string;
  field: string;
  value: AnswerMap[string] | null;
}

/**
 * Saves an answer for a signed-in account. The chip the user clicked is
 * marked at once (the cached profile response is updated before the request
 * returns, and rolled back on failure); the scores follow as soon as the
 * server has re-scored — the answered call straight from the response, every
 * other call that asks the same thing by refetching. The mutation stays
 * pending until that refetch is done, so the question can't be answered twice
 * against stale scores.
 */
export function useSaveAnswerMutation() {
  const queryClient = useQueryClient();
  const lang = useLang();
  return useMutation({
    mutationFn: ({ oppId, field, value }: SaveAnswerVariables) => answersApi.save(oppId, field, value, lang),
    onMutate: async ({ field, value }) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.detail() });
      const previous = queryClient.getQueryData<GetProfileResponse>(profileKeys.detail());
      if (previous) {
        const answers = { ...previous.answers };
        if (value === null) delete answers[field];
        else answers[field] = value;
        queryClient.setQueryData<GetProfileResponse>(profileKeys.detail(), { ...previous, answers });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(profileKeys.detail(), context.previous);
    },
    onSuccess: (data, { oppId }) => {
      if (data.opportunity) queryClient.setQueryData(opportunitiesKeys.detail(oppId, lang), data.opportunity);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.detail() }),
        queryClient.invalidateQueries({ queryKey: opportunitiesKeys.all }),
      ]),
  });
}
