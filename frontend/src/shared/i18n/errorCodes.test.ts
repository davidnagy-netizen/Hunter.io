import { describe, expect, it } from "vitest";
import enErrors from "./locales/en/errors.json";
import huErrors from "./locales/hu/errors.json";

// The backend's contract, at the repository root (`../../../../openapi.yaml`
// from here). Read as text: the only thing taken from it is the ErrorCode list.
const contract = import.meta.glob<string>("../../../../openapi.yaml", { query: "?raw", import: "default", eager: true });

function documentedErrorCodes(): string[] {
  const text = (Object.values(contract)[0] ?? "").replace(/\r\n/g, "\n");
  const block = text.match(/\n {4}ErrorCode:\n[\s\S]*?\n {6}enum:\n((?: {8}- [A-Z_]+\n)+)/);
  return block ? [...block[1].matchAll(/- ([A-Z_]+)/g)].map((m) => m[1]) : [];
}

describe("error codes", () => {
  const codes = documentedErrorCodes();

  it("reads the code list from the backend's contract", () => {
    expect(codes.length).toBeGreaterThan(25);
    expect(codes).toContain("CSRF_REJECTED");
  });

  it.each(codes)("%s has a message in both languages", (code) => {
    expect((huErrors as Record<string, string>)[code], `hu:${code}`).toBeTruthy();
    expect((enErrors as Record<string, string>)[code], `en:${code}`).toBeTruthy();
  });

  it("has no message the contract doesn't mention (a code was renamed or removed)", () => {
    const known = new Set(codes);
    const orphans = Object.keys(enErrors).filter((code) => /^[A-Z_]+$/.test(code) && !known.has(code));
    expect(orphans).toEqual([]);
  });
});
