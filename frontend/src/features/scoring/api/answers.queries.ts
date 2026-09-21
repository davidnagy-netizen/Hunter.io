import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/features/profile/api/profile.queries";
import type { GetProfileResponse } from "@/features/profile/types/profile.types";
import { answersApi } from "./answers.api";
import type { AnswerMap } from "../types/scoring.types";

interface SaveAnswerVariables {
  oppId: string;
  field: string;
  value: AnswerMap[string] | null;
}

/**
 * Saves an answer for a signed-in account, updating the cached profile
 * response *before* the request returns. The whole point of the
 * ask-and-recalculate loop is that every affected score changes the instant
 * the user clicks — waiting on a round trip would lose that. On failure the
 * cache is rolled back to what the server last confirmed.
 */
export function useSaveAnswerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ oppId, field, value }: SaveAnswerVariables) => answersApi.save(oppId, field, value),
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKeys.detail() }),
  });
}
