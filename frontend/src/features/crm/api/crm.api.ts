import { httpClient } from "@/shared/api/httpClient";
import { toApiParams, type ContactsState } from "../domain/contactsState";
import type { ContactDetail, ContactPatch, ContactsResponse, CrmBoardResponse, LeadsResponse, NotePayload, TaskPayload } from "../types/crm.types";

/** The address of the CSV export for a filter — a plain link the browser downloads, so it carries the session cookie itself. */
export function contactsCsvUrl(state: ContactsState): string {
  const { page: _page, pageSize: _pageSize, ...filters } = toApiParams(state);
  return httpClient.getUri({ url: "/admin/crm/contacts", params: { ...filters, format: "csv" } });
}

export const crmApi = {
  board: () => httpClient.get<CrmBoardResponse>("/admin/crm").then((res) => res.data),

  contacts: (state: ContactsState) =>
    httpClient.get<ContactsResponse>("/admin/crm/contacts", { params: toApiParams(state) }).then((res) => res.data),

  leads: () => httpClient.get<LeadsResponse>("/admin/crm/leads").then((res) => res.data),

  contact: (id: string) => httpClient.get<ContactDetail>("/admin/crm/contact", { params: { id } }).then((res) => res.data),

  updateContact: (patch: ContactPatch) => httpClient.post("/admin/crm/contact", patch).then((res) => res.data),

  addNote: (payload: NotePayload) => httpClient.post("/admin/crm/note", payload).then((res) => res.data),

  deleteNote: (id: string, noteId: string) =>
    httpClient.post("/admin/crm/note", { id, noteId, remove: true }).then((res) => res.data),

  addTask: (payload: TaskPayload) => httpClient.post("/admin/crm/task", payload).then((res) => res.data),

  setTaskDone: (id: string, taskId: string, done: boolean) =>
    httpClient.post("/admin/crm/task", { id, taskId, done }).then((res) => res.data),

  deleteTask: (id: string, taskId: string) =>
    httpClient.post("/admin/crm/task", { id, taskId, remove: true }).then((res) => res.data),

  deleteLead: (id: string) => httpClient.post("/admin/crm/lead", { id, remove: true }).then((res) => res.data),
};
