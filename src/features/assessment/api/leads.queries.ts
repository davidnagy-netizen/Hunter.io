import { useMutation } from "@tanstack/react-query";
import { leadsApi, type LeadPayload } from "./leads.api";

export function useSubmitLeadMutation() {
  return useMutation({ mutationFn: (payload: LeadPayload) => leadsApi.submit(payload) });
}
