/**
 * The scoring feature's public domain API. Everything here is a re-export of
 * the server's own engine (see `serverEngine.d.ts`) — the client-side
 * "fallback" the product requires is literally the same code, not a
 * reimplementation, so it cannot drift from what the server computes.
 *
 * Other features import from here (or the feature's hooks), never from
 * `@server-src` directly.
 */
export {
  DEFAULT_REFERENCE_DATE,
  checkRule,
  daysToDeadline,
  evaluateEligibility,
  ruleLabel,
} from "@server-src/engine/eligibility.js";
export { explainScore, hunterScore, rankedOpps, scoreBand } from "@server-src/engine/scoring.js";
export { normalizeProfile } from "@server-src/engine/profile.js";
