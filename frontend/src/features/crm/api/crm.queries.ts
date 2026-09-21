import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "./crm.api";
import type { ContactsState } from "../domain/contactsState";
import type { ContactPatch, NotePayload, TaskPayload } from "../types/crm.types";

export const crmKeys = {
  all: ["crm"] as const,
  board: () => [...crmKeys.all, "board"] as const,
  contacts: (state: ContactsState) => [...crmKeys.all, "contacts", state] as const,
  leads: () => [...crmKeys.all, "leads"] as const,
  contact: (id: string) => [...crmKeys.all, "contact", id] as const,
};

export function useCrmBoardQuery() {
  return useQuery({ queryKey: crmKeys.board(), queryFn: crmApi.board });
}

export function useContactsQuery(state: ContactsState) {
  // The previous page stays on screen while the next filter loads, so the list doesn't flash empty on every keystroke of a filter change.
  return useQuery({ queryKey: crmKeys.contacts(state), queryFn: () => crmApi.contacts(state), placeholderData: keepPreviousData });
}

export function useLeadsQuery() {
  return useQuery({ queryKey: crmKeys.leads(), queryFn: crmApi.leads });
}

export function useContactQuery(id: string) {
  return useQuery({ queryKey: crmKeys.contact(id), queryFn: () => crmApi.contact(id) });
}

/**
 * Every CRM write refetches rather than patching a cached copy: a stage
 * change also moves the lifecycle-derived numbers (MRR, counts, days in
 * stage), and those are the server's to compute.
 */
export function useInvalidateCrm() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: crmKeys.all });
}

export function useUpdateContactMutation() {
  const invalidate = useInvalidateCrm();
  return useMutation({ mutationFn: (patch: ContactPatch) => crmApi.updateContact(patch), onSuccess: invalidate });
}

export function useAddNoteMutation() {
  const invalidate = useInvalidateCrm();
  return useMutation({ mutationFn: (payload: NotePayload) => crmApi.addNote(payload), onSuccess: invalidate });
}

export function useDeleteNoteMutation() {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: ({ id, noteId }: { id: string; noteId: string }) => crmApi.deleteNote(id, noteId),
    onSuccess: invalidate,
  });
}

export function useAddTaskMutation() {
  const invalidate = useInvalidateCrm();
  return useMutation({ mutationFn: (payload: TaskPayload) => crmApi.addTask(payload), onSuccess: invalidate });
}

export function useSetTaskDoneMutation() {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: ({ id, taskId, done }: { id: string; taskId: string; done: boolean }) => crmApi.setTaskDone(id, taskId, done),
    onSuccess: invalidate,
  });
}

export function useDeleteTaskMutation() {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: ({ id, taskId }: { id: string; taskId: string }) => crmApi.deleteTask(id, taskId),
    onSuccess: invalidate,
  });
}

export function useDeleteLeadMutation() {
  const invalidate = useInvalidateCrm();
  return useMutation({ mutationFn: (id: string) => crmApi.deleteLead(id), onSuccess: invalidate });
}
