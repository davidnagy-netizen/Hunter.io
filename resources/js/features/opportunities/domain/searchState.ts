export type SearchSort = "" | "-score" | "deadline" | "-budget";
export const SEARCH_SORTS: SearchSort[] = ["", "-score", "deadline", "-budget"];
export const PAGE_SIZE = 20;

/** Facets that hold several values (OR-ed inside one facet, AND-ed across facets). */
export const LIST_FACETS = ["program", "goals", "actionCode"] as const;
export type ListFacet = (typeof LIST_FACETS)[number];

/**
 * Everything a search is, as plain data. The URL is the source of truth for
 * this (see `useSearchState`), so a search can be linked, reloaded and
 * navigated with the back button — the legacy app kept it in memory only.
 */
export interface SearchState {
  q: string;
  sort: SearchSort;
  page: number;
  filters: {
    program: string[];
    goals: string[];
    actionCode: string[];
    consortium?: "required" | "solo";
    eligibleOnly: boolean;
  };
}

export const EMPTY_SEARCH: SearchState = {
  q: "",
  sort: "",
  page: 1,
  filters: { program: [], goals: [], actionCode: [], eligibleOnly: false },
};

const list = (params: URLSearchParams, key: string) => (params.get(key) ?? "").split(",").filter(Boolean);

export function parseSearchParams(params: URLSearchParams): SearchState {
  const sort = params.get("sort") ?? "";
  const consortium = params.get("consortium");
  return {
    q: params.get("q") ?? "",
    sort: (SEARCH_SORTS as string[]).includes(sort) ? (sort as SearchSort) : "",
    page: Math.max(1, Number(params.get("page")) || 1),
    filters: {
      program: list(params, "program"),
      goals: list(params, "goals"),
      actionCode: list(params, "actionCode"),
      consortium: consortium === "required" || consortium === "solo" ? consortium : undefined,
      eligibleOnly: params.get("eligibleOnly") === "true",
    },
  };
}

/** The URL form: only what differs from the defaults, so a fresh search has a clean URL. */
export function toSearchParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.sort) params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  for (const key of LIST_FACETS) if (state.filters[key].length) params.set(key, state.filters[key].join(","));
  if (state.filters.consortium) params.set("consortium", state.filters.consortium);
  if (state.filters.eligibleOnly) params.set("eligibleOnly", "true");
  return params;
}

/** The request the server's `/api/search` understands: the same params plus paging and the language its wording should use. */
export function toSearchRequest(state: SearchState, lang: "hu" | "en"): string {
  const params = toSearchParams({ ...state, page: 1 });
  params.set("page", String(state.page));
  params.set("pageSize", String(PAGE_SIZE));
  params.set("lang", lang);
  return params.toString();
}

/** Toggles one value of a facet; any change of filters returns to page 1 (the old page may no longer exist). */
export function toggleFacetValue(state: SearchState, facet: ListFacet | "consortium", value: string): SearchState {
  if (facet === "consortium") {
    const next = state.filters.consortium === value ? undefined : (value as "required" | "solo");
    return { ...state, page: 1, filters: { ...state.filters, consortium: next } };
  }
  const current = state.filters[facet];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return { ...state, page: 1, filters: { ...state.filters, [facet]: next } };
}

export function hasActiveFilters(state: SearchState): boolean {
  const f = state.filters;
  return f.program.length + f.goals.length + f.actionCode.length > 0 || Boolean(f.consortium) || f.eligibleOnly;
}
