import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/shared/api/profile.queries";
import type { GetProfileResponse } from "@/shared/types/profile.types";
import { opportunitiesApi } from "./opportunities.api";

/** Toggles a saved call on the server, flipping it in the cached profile response first so the UI responds at once. */
export function useToggleSavedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (oppId: string) => opportunitiesApi.toggleSaved(oppId),
    onMutate: async (oppId) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.detail() });
      const previous = queryClient.getQueryData<GetProfileResponse>(profileKeys.detail());
      if (previous) {
        const saved = previous.saved.includes(oppId) ? previous.saved.filter((x) => x !== oppId) : [...previous.saved, oppId];
        queryClient.setQueryData<GetProfileResponse>(profileKeys.detail(), { ...previous, saved });
      }
      return { previous };
    },
    onError: (_e, _id, context) => {
      if (context?.previous) queryClient.setQueryData(profileKeys.detail(), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKeys.detail() }),
  });
}
