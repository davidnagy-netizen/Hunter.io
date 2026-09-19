export const CONTACT_SORTS = ["recent", "engagement", "value", "expiring", "stale", "company"] as const;
export type ContactSort = (typeof CONTACT_SORTS)[number];
export const CONTACTS_PAGE_SIZE = 25;

/**
 * The contacts list, as plain data. Kept in the URL (see `useContactsState`)
 * so a filtered view can be linked, survives a reload, and the back button
 * steps through it. Empty string means "no filter".
 */
export interface ContactsState {
  q: string;
  stage: string;
  lifecycle: string;
  source: string;
  sort: ContactSort;
  page: number;
}

export const EMPTY_CONTACTS: ContactsState = { q: "", stage: "", lifecycle: "", source: "", sort: "recent", page: 1 };

export type ContactFilterKey = "q" | "stage" | "lifecycle" | "source" | "sort";

export function parseContactsParams(params: URLSearchParams): ContactsState {
  const sort = params.get("sort") ?? "";
  return {
    q: params.get("q") ?? "",
    stage: params.get("stage") ?? "",
    lifecycle: params.get("lifecycle") ?? "",
    source: params.get("source") ?? "",
    sort: (CONTACT_SORTS as readonly string[]).includes(sort) ? (sort as ContactSort) : "recent",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

/** The URL form: only what differs from the defaults, so an unfiltered list has a clean URL. */
export function toContactsParams(state: ContactsState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.stage) params.set("stage", state.stage);
  if (state.lifecycle) params.set("lifecycle", state.lifecycle);
  if (state.source) params.set("source", state.source);
  if (state.sort !== "recent") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  return params;
}

/** What the server is asked: empty filters left out, sort and paging always spelled out. */
export function toApiParams(state: ContactsState): Record<string, string | number> {
  const params: Record<string, string | number> = { sort: state.sort, page: state.page, pageSize: CONTACTS_PAGE_SIZE };
  if (state.q.trim()) params.q = state.q.trim();
  if (state.stage) params.stage = state.stage;
  if (state.lifecycle) params.lifecycle = state.lifecycle;
  if (state.source) params.source = state.source;
  return params;
}

/** Changing a filter, the search or the sort goes back to the first page — page 4 of the old result means nothing in the new one. */
export function withFilter(state: ContactsState, key: ContactFilterKey, value: string): ContactsState {
  if (key === "sort") {
    return { ...state, sort: (CONTACT_SORTS as readonly string[]).includes(value) ? (value as ContactSort) : "recent", page: 1 };
  }
  return { ...state, [key]: value, page: 1 };
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / (pageSize || CONTACTS_PAGE_SIZE)));
}
