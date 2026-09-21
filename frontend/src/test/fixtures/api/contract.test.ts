import Ajv from "ajv";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

/**
 * Every recorded API response must satisfy the backend's own contract (../../../../../openapi.yaml). The fixtures are
 * real responses (see frontend/scripts/generate-api-fixtures.php), so this checks the backend against its contract
 * too — and that the frontend's tests are not built on shapes the API never sends.
 */
const contract = Object.values(import.meta.glob<string>("../../../../../openapi.yaml", { query: "?raw", import: "default", eager: true }))[0];
const fixtures = import.meta.glob<unknown>("./*.json", { import: "default", eager: true });

type Schema = Record<string, unknown>;

/** OpenAPI 3.0 schema → JSON Schema (nullable, boolean exclusiveMinimum, examples). */
function convert(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(convert);
  if (node && typeof node === "object") {
    const out: Schema = {};
    for (const [key, value] of Object.entries(node)) {
      if ((key === "exclusiveMinimum" && typeof value === "boolean") || key === "example" || key === "discriminator") continue;
      out[key] = convert(value);
    }
    if (out.nullable === true) {
      delete out.nullable;
      if (out.type && !out.allOf) out.type = ([] as unknown[]).concat(out.type, "null");
      else {
        delete out.type;
        return { anyOf: [out, { type: "null" }] };
      }
    }
    return out;
  }
  return node;
}

const spec = parse(contract) as { components: { schemas: Record<string, unknown> } };
const ajv = new Ajv({ strict: false, validateFormats: false, allErrors: true });
ajv.addSchema({ $id: "spec", components: convert(spec.components) as object });

/** fixture file → [schema name, which part of the file the schema describes]. */
const CHECKS: Record<string, [string, ((body: any) => unknown)?]> = {
  "catalog.subscriber.hu.json": ["FullCatalog"],
  "catalog.subscriber.en.json": ["FullCatalog"],
  "catalog.gated.json": ["GatedCatalog"],
  "catalog.anonymous.json": ["GatedCatalog"],
  "search.subscriber.json": ["SearchResponse"],
  "profile.subscriber.json": ["GetProfileResponse"],
  "me.subscriber.json": ["MeResponse"],
  "detail.consortium.hu.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.consortium.en.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.consortium.answered.hu.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.blocked.hu.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.blocked.en.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.estimated.hu.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.estimated.en.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.plain.hu.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.plain.en.json": ["OpportunityDetail", (b) => b.opportunity],
  "detail.locked.json": ["OpportunityDetail", (b) => b.opportunity],
  "answer.consortium.json": ["OpportunityDetail", (b) => b.opportunity],
};

describe("recorded API responses", () => {
  it("found the contract and the fixtures", () => {
    expect(contract).toContain("openapi: 3.0.3");
    expect(Object.keys(fixtures).length).toBeGreaterThan(15);
  });

  it.each(Object.entries(CHECKS))("%s satisfies %s", (file, [schema, pick]) => {
    const body = fixtures[`./${file}`];
    expect(body, `fixture ${file} exists`).toBeDefined();
    const validate = ajv.compile({ $ref: `spec#/components/schemas/${schema}` });
    const ok = validate(pick ? pick(body) : body);
    const problems = (validate.errors ?? []).slice(0, 6).map((e) => `${e.instancePath || "/"} ${e.message}`);
    expect(ok, problems.join("\n")).toBe(true);
  });

  it("has a check for every recorded file, so a new fixture can't go unvalidated", () => {
    const covered = new Set(Object.keys(CHECKS).map((f) => `./${f}`));
    const unchecked = Object.keys(fixtures).filter((f) => !covered.has(f) && f !== "./_meta.json" && f !== "./save.toggle.json");
    expect(unchecked).toEqual([]);
  });
});
