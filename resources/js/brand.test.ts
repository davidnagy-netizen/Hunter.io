import { describe, expect, it } from "vitest";
import { BRAND } from "@/brand";

/**
 * The product was renamed from Hunter to Fundor (fundor.hu, 2026-09-20).
 * `shared/brand.ts` is the one file that may mention the old name (it documents the rename).
 * Acceptance criterion CR-01: no occurrence of the old name in either
 * language variant, the page title or the served files. These are the only
 * server-owned tokens still allowed to say it — they name things that live in
 * the backend (env vars, the session cookie, the old prototype engine's exported
 * function, the legacy app's storage key, a document's filename) and are renamed there, not here.
 */
const SERVER_OWNED = /HUNTER_[A-Z_]+|hunter_state|hunter_session|hunterScore|HUNTER-PROJECT-OVERVIEW/g;

const locales = import.meta.glob<string>("./**/*.json", { query: "?raw", import: "default", eager: true });
const sources = import.meta.glob<string>(["./**/*.ts", "./**/*.tsx", "!./brand.test.ts", "!./brand.ts"], { query: "?raw", import: "default", eager: true });
const indexHtml = import.meta.glob<string>("../index.html", { query: "?raw", import: "default", eager: true });
const served = import.meta.glob<string>("../static/*.{svg,html,json,txt,webmanifest}", { query: "?raw", import: "default", eager: true });

function offenders(files: Record<string, string>): string[] {
  return Object.entries(files).flatMap(([path, text]) =>
    (text.replace(SERVER_OWNED, "").match(/.{0,30}hunter.{0,30}/gi) ?? []).map((hit) => `${path}: …${hit}…`),
  );
}

describe("brand", () => {
  it("is Fundor, at fundor.hu", () => {
    expect(BRAND).toEqual({ name: "Fundor", wordmark: "FUNDOR", domain: "fundor.hu" });
  });

  it("the page title is the new name", () => {
    expect(Object.values(indexHtml)[0]).toMatch(/<title>Fundor<\/title>/);
  });

  it("no translated copy — in either language — uses the old name", () => {
    expect(Object.keys(locales).length).toBeGreaterThan(10);
    expect(offenders(locales)).toEqual([]);
  });

  it("no source file uses the old name except for the server-owned tokens", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
    expect(offenders(sources)).toEqual([]);
  });

  it("no served file (index.html, public/) uses the old name", () => {
    expect(Object.keys(served).length).toBeGreaterThan(0);
    expect(offenders({ ...indexHtml, ...served })).toEqual([]);
  });

  it("actually catches the old name (so a green run means something)", () => {
    expect(offenders({ "x.json": '{"a":"Welcome to Hunter Plus"}' })).toHaveLength(1);
    expect(offenders({ "x.ts": "const key = 'HUNTER_TODAY'; hunterScore(); // hunter_state, hunter_session" })).toEqual([]);
  });
});
