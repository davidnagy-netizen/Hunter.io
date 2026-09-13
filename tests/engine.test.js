import test from "node:test";
import assert from "node:assert/strict";

import { DEMO_PROFILE } from "../src/data/referenceData.js";
import { OPPS } from "../src/data/mockGrants.js";
import { checkRule, evaluateEligibility, DEFAULT_REFERENCE_DATE } from "../src/engine/eligibility.js";
import { hunterScore, rankedOpps, scoreBand } from "../src/engine/scoring.js";

test("Rule Engine Operators", () => {
  assert.equal(checkRule(28, "between", [5, 249]), "pass");
  assert.equal(checkRule(4, "between", [5, 249]), "fail");
  assert.equal(checkRule("HU12", "not_in", ["HU11"]), "pass");
  assert.equal(checkRule("HU11", "not_in", ["HU11"]), "fail");
  assert.equal(checkRule("28", "in", ["01", "02", "03"]), "fail");
  assert.equal(checkRule("01", "in", ["01", "02", "03"]), "pass");
  assert.equal(checkRule(4, ">=", 2), "pass");
  assert.equal(checkRule(1, ">=", 2), "fail");
  assert.equal(checkRule(true, "==", true), "pass");
  assert.equal(checkRule(false, "==", true), "fail");
  assert.equal(checkRule(undefined, "==", true), "unknown");
  assert.equal(checkRule(["digitalization", "it"], "includes_any", ["digitalization", "ai"]), "pass");
  assert.equal(checkRule(["building"], "includes_any", ["digitalization", "ai"]), "fail");
});

test("Eligibility & Scoring Fidelity on Demo Profile", () => {
  const szechenyi = OPPS.find((o) => o.id === "szechenyi-tech");
  const resSzechenyi = hunterScore(szechenyi, DEMO_PROFILE);
  assert.equal(resSzechenyi.blocked, false);
  assert.equal(resSzechenyi.score, 95);
  assert.equal(resSzechenyi.elig.status, "CONDITIONAL");

  const ginop = OPPS.find((o) => o.id === "ginop-dig");
  const resGinop = hunterScore(ginop, DEMO_PROFILE);
  assert.equal(resGinop.blocked, false);
  assert.equal(resGinop.score, 87);
  assert.equal(resGinop.elig.status, "INSUFFICIENT_DATA");
  assert.equal(resGinop.estimated, true);

  // Answering de minimis: yes -> score rises to 89
  const resGinopYes = hunterScore(ginop, DEMO_PROFILE, { "ginop-dig:de_minimis_ok": true });
  assert.equal(resGinopYes.blocked, false);
  assert.equal(resGinopYes.score, 89);
  assert.equal(resGinopYes.elig.status, "CONDITIONAL");

  // Answering de minimis: no -> NOT_ELIGIBLE
  const resGinopNo = hunterScore(ginop, DEMO_PROFILE, { "ginop-dig:de_minimis_ok": false });
  assert.equal(resGinopNo.blocked, true);
  assert.equal(resGinopNo.elig.status, "NOT_ELIGIBLE");

  // DIMOP Plusz -> 87 CONDITIONAL
  const dimop = OPPS.find((o) => o.id === "dimop-ai");
  const resDimop = hunterScore(dimop, DEMO_PROFILE);
  assert.equal(resDimop.blocked, false);
  assert.equal(resDimop.score, 87);
  assert.equal(resDimop.elig.status, "CONDITIONAL");

  // TOP Plusz -> NOT_ELIGIBLE (Pest county excluded)
  const top = OPPS.find((o) => o.id === "top-site");
  const resTop = hunterScore(top, DEMO_PROFILE);
  assert.equal(resTop.blocked, true);
  assert.equal(resTop.elig.status, "NOT_ELIGIBLE");

  // KAP Agri -> NOT_ELIGIBLE (TEÁOR not 01/02/03)
  const kap = OPPS.find((o) => o.id === "kap-agri");
  const resKap = hunterScore(kap, DEMO_PROFILE);
  assert.equal(resKap.blocked, true);
  assert.equal(resKap.elig.status, "NOT_ELIGIBLE");

  // EIC Accelerator -> NOT_ELIGIBLE (investment 30M below 50M floor)
  const eic = OPPS.find((o) => o.id === "eic");
  const resEic = hunterScore(eic, DEMO_PROFILE);
  assert.equal(resEic.blocked, true);
  assert.equal(resEic.elig.status, "NOT_ELIGIBLE");
});

test("Ranking logic sorts eligible top scores first and places blocked at bottom", () => {
  const ranked = rankedOpps(DEMO_PROFILE, OPPS);
  assert.ok(ranked.length > 0);
  // Top result should be Széchenyi Tech (95)
  assert.equal(ranked[0].opp.id, "szechenyi-tech");
  assert.equal(ranked[0].res.score, 95);
  // Last items should be blocked
  assert.equal(ranked[ranked.length - 1].res.blocked, true);
});

test("Score bands match classification", () => {
  assert.equal(scoreBand(95).key, "strong");
  assert.equal(scoreBand(80).key, "relevant");
  assert.equal(scoreBand(60).key, "conditional");
  assert.equal(scoreBand(40).key, "low");
});
