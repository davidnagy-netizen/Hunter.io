/**
 * The scoring feature's public domain API. Everything here is a re-export of
 * the vendored browser engine (`vendor/engine-src`, see its README) — the
 * client-side scoring the product keeps on purpose, so a subscriber's catalog
 * can be ranked without a request per call, and as the fallback if the API
 * cannot score.
 *
 * **It is a copy of the Node prototype's engine, and the PHP backend has its
 * own implementation of the same formulas.** They can drift; until a parity
 * test compares them, a difference between a score from the API (search,
 * detail) and one computed here is a bug in one of them.
 *
 * Other features import from here (or the feature's hooks), never from
 * `@engine-src` directly.
 */
export {
  DEFAULT_REFERENCE_DATE,
  checkRule,
  daysToDeadline,
  evaluateEligibility,
  ruleLabel,
} from "@engine-src/engine/eligibility.js";
// The server still calls this `hunterScore` (backend rebrand pending); it is renamed at this one boundary so the rest of the app never says Fundor.
export { explainScore, hunterScore as fundorScore, rankedOpps, scoreBand } from "@engine-src/engine/scoring.js";
export { normalizeProfile } from "@engine-src/engine/profile.js";
