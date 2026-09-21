import { describe, expect, it } from "vitest";
import { EMPTY_SEARCH, hasActiveFilters, parseSearchParams, toSearchParams, toSearchRequest, toggleFacetValue } from "./searchState";

describe("search state <-> URL", () => {
  it("a fresh search has an empty URL", () => {
    expect(toSearchParams(EMPTY_SEARCH).toString()).toBe("");
  });

  it("round-trips a full state", () => {
    const state = {
      q: "hydrogen",
      sort: "-score" as const,
      page: 3,
      filters: { program: ["HORIZON", "EDF"], goals: ["energy"], actionCode: [], consortium: "required" as const, eligibleOnly: true },
    };
    expect(parseSearchParams(toSearchParams(state))).toEqual(state);
  });

  it("ignores a junk sort, a junk consortium and a nonsense page", () => {
    const s = parseSearchParams(new URLSearchParams("sort=bogus&consortium=maybe&page=-4"));
    expect([s.sort, s.filters.consortium, s.page]).toEqual(["", undefined, 1]);
  });
});

describe("toSearchRequest", () => {
  it("adds paging and the language, and keeps the requested page", () => {
    const qs = new URLSearchParams(toSearchRequest({ ...EMPTY_SEARCH, q: "ai", page: 2 }, "en"));
    expect([qs.get("q"), qs.get("page"), qs.get("pageSize"), qs.get("lang")]).toEqual(["ai", "2", "20", "en"]);
  });

  it("joins multi-valued facets with commas, as the server expects", () => {
    const qs = new URLSearchParams(toSearchRequest({ ...EMPTY_SEARCH, filters: { ...EMPTY_SEARCH.filters, goals: ["ai", "it"] } }, "hu"));
    expect(qs.get("goals")).toBe("ai,it");
  });
});

describe("toggleFacetValue", () => {
  it("adds and removes a value, returning to page 1", () => {
    const on = toggleFacetValue({ ...EMPTY_SEARCH, page: 4 }, "goals", "ai");
    expect(on.filters.goals).toEqual(["ai"]);
    expect(on.page).toBe(1);
    expect(toggleFacetValue(on, "goals", "ai").filters.goals).toEqual([]);
  });

  it("treats consortium as a single choice that toggles off when picked again", () => {
    const on = toggleFacetValue(EMPTY_SEARCH, "consortium", "required");
    expect(on.filters.consortium).toBe("required");
    expect(toggleFacetValue(on, "consortium", "required").filters.consortium).toBeUndefined();
  });

  it("reports whether any filter is active", () => {
    expect(hasActiveFilters(EMPTY_SEARCH)).toBe(false);
    expect(hasActiveFilters(toggleFacetValue(EMPTY_SEARCH, "program", "EDF"))).toBe(true);
  });
});
