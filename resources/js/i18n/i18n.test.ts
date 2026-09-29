import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.resetModules();
});

it.each([
  ["Europe/Budapest", null, "hu"],
  ["Asia/Singapore", null, "en"],
  ["Europe/London", "hu", "hu"],
  ["Europe/Budapest", "en", "en"],
  ["Europe/Budapest", "de", "hu"],
  [undefined, null, "en"],
] as const)("initializes translations and UI together for %s with saved %s", async (timeZone, saved, expected) => {
  vi.resetModules();
  localStorage.clear();
  const options = Intl.DateTimeFormat().resolvedOptions();
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({ ...options, timeZone } as Intl.ResolvedDateTimeFormatOptions);
  if (saved) localStorage.setItem("fundor-rewrite-ui", JSON.stringify({ state: { lang: saved }, version: 0 }));

  const { i18next } = await import("./i18n");
  const { useUiStore } = await import("../store/uiStore");
  expect(i18next.language).toBe(expected);
  expect(useUiStore.getState().lang).toBe(expected);

  const selected = expected === "en" ? "hu" : "en";
  useUiStore.getState().setLang(selected);
  expect(i18next.language).toBe(selected);
  expect(JSON.parse(localStorage.getItem("fundor-rewrite-ui") ?? "{}").state.lang).toBe(selected);
});

it("falls back to English when storage and time zone detection fail", async () => {
  vi.resetModules();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Unavailable"); });
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(() => { throw new Error("Unavailable"); });
  const { i18next } = await import("./i18n");
  const { useUiStore } = await import("../store/uiStore");
  expect(i18next.language).toBe("en");
  expect(useUiStore.getState().lang).toBe("en");
});
