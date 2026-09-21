/**
 * Typed access to the recorded API responses in `test/fixtures/api` — real
 * output of the Laravel backend for one subscriber company (see
 * `frontend/scripts/generate-api-fixtures.php`), validated against
 * `openapi.yaml` by `fixtures/api/contract.test.ts`. Tests build on these
 * instead of hand-written shapes, so they can't drift from what the API sends.
 */
import type { CatalogResponse, FullCatalogResponse, GatedCatalogResponse } from "@/features/opportunities/types/opportunities.types";
import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";
import catalogGated from "./fixtures/api/catalog.gated.json";
import catalogEn from "./fixtures/api/catalog.subscriber.en.json";
import catalogHu from "./fixtures/api/catalog.subscriber.hu.json";
import consortiumAnswered from "./fixtures/api/detail.consortium.answered.hu.json";
import consortiumEn from "./fixtures/api/detail.consortium.en.json";
import consortiumHu from "./fixtures/api/detail.consortium.hu.json";
import blockedEn from "./fixtures/api/detail.blocked.en.json";
import blockedHu from "./fixtures/api/detail.blocked.hu.json";
import plainHu from "./fixtures/api/detail.plain.hu.json";
import meta from "./fixtures/api/_meta.json";

type Lang = "hu" | "en";

const clone = <T>(value: unknown): T => structuredClone(value) as T;

/** A subscriber's scored catalog: 12 calls, two of them blocked, `stats` from the server. */
export const subscriberCatalog = (lang: Lang = "hu") => clone<FullCatalogResponse>(lang === "en" ? catalogEn : catalogHu);

/** A registered, unsubscribed account's catalog: teasers only. */
export const gatedCatalog = () => clone<GatedCatalogResponse>(catalogGated);

export const asCatalog = (c: CatalogResponse) => c;

/** The named calls the fixtures were recorded for. */
export const CALL = meta.ids;

const details = {
  consortium: { hu: consortiumHu, en: consortiumEn },
  blocked: { hu: blockedHu, en: blockedEn },
  plain: { hu: plainHu, en: plainHu },
} as const;

/** One recorded call detail: `consortium` (asks a question), `blocked`, or `plain`. */
export const detailOf = (kind: keyof typeof details, lang: Lang = "hu") => clone<ScoredOpportunity>(details[kind][lang].opportunity);

/** The consortium call after `consortium_ready` was answered "yes". */
export const answeredConsortium = () => clone<ScoredOpportunity>(consortiumAnswered.opportunity);

/** A catalog row by id. */
export const rowOf = (catalog: FullCatalogResponse, id: string) => {
  const row = catalog.opportunities.find((o) => o.id === id);
  if (!row) throw new Error(`fixture has no call ${id}`);
  return row;
};
