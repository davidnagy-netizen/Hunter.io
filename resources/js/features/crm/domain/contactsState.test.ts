import { describe, expect, it } from "vitest";
import { EMPTY_CONTACTS, pageCount, parseContactsParams, toApiParams, toContactsParams, withFilter } from "./contactsState";

describe("contacts URL state", () => {
  it("an empty URL is the default list", () => {
    expect(parseContactsParams(new URLSearchParams(""))).toEqual(EMPTY_CONTACTS);
  });

  it("round-trips a filtered, sorted, paged view", () => {
    const state = { q: "kft", stage: "won", lifecycle: "trial", source: "signup", sort: "value" as const, page: 3 };
    expect(parseContactsParams(toContactsParams(state))).toEqual(state);
  });

  it("writes only what differs from the defaults", () => {
    expect(toContactsParams(EMPTY_CONTACTS).toString()).toBe("");
    expect(toContactsParams({ ...EMPTY_CONTACTS, stage: "won" }).toString()).toBe("stage=won");
  });

  it("ignores an unknown sort and a nonsense page", () => {
    const state = parseContactsParams(new URLSearchParams("sort=bogus&page=-4"));
    expect(state.sort).toBe("recent");
    expect(state.page).toBe(1);
  });
});

describe("withFilter", () => {
  it("goes back to page 1 on any change, since the old page means nothing in the new result", () => {
    const on3 = { ...EMPTY_CONTACTS, page: 3 };
    expect(withFilter(on3, "stage", "won").page).toBe(1);
    expect(withFilter(on3, "q", "x").page).toBe(1);
    expect(withFilter(on3, "sort", "value").page).toBe(1);
  });

  it("clearing a filter is an empty value", () => {
    expect(withFilter({ ...EMPTY_CONTACTS, stage: "won" }, "stage", "").stage).toBe("");
  });

  it("falls back to the default sort for one it doesn't know", () => {
    expect(withFilter(EMPTY_CONTACTS, "sort", "bogus").sort).toBe("recent");
  });
});

describe("toApiParams", () => {
  it("always states sort and paging, and leaves empty filters out", () => {
    expect(toApiParams(EMPTY_CONTACTS)).toEqual({ sort: "recent", page: 1, pageSize: 25 });
  });

  it("trims the search text and includes the active filters", () => {
    expect(toApiParams({ ...EMPTY_CONTACTS, q: "  kata ", stage: "won" })).toEqual({ sort: "recent", page: 1, pageSize: 25, q: "kata", stage: "won" });
  });
});

describe("pageCount", () => {
  it("rounds up and is never below one", () => {
    expect(pageCount(0, 25)).toBe(1);
    expect(pageCount(25, 25)).toBe(1);
    expect(pageCount(26, 25)).toBe(2);
  });
});
