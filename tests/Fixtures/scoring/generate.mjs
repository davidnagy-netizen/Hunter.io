// Generates tests/Fixtures/scoring/{catalog,expected}.json from the prototype's JS engine (frozen behaviour).
import fs from "node:fs";
const ENGINE = process.env.ENGINE_DIR; // a directory holding engine/ and data/ from the prototype's src/
const OUT = process.env.OUT_DIR; const SRC_CATALOG = process.env.SRC_CATALOG;
const { hunterScore, explainScore } = await import(ENGINE + "/engine/scoring.js");
const { normalizeProfile } = await import(ENGINE + "/engine/profile.js");
const { DEMO_PROFILE } = await import(ENGINE + "/data/referenceData.js");
const cases = JSON.parse(fs.readFileSync(process.env.PROFILES, "utf8"));
const all = JSON.parse(fs.readFileSync(SRC_CATALOG, "utf8")).opportunities;
const ref = new Date("2026-09-21T00:00:00Z");

// A varied subset: spread across the sorted ids, plus every call with a feature the formulas branch on.
const sorted = [...all].sort((a, b) => a.id.localeCompare(b.id));
const pick = new Map(); const add = (o) => pick.set(o.id, o);
sorted.filter((_, i) => i % 14 === 0).forEach(add);
for (const f of [(o) => o.partnerShare, (o) => !o.fundingMin && !o.fundingMax, (o) => o.consortium?.required && o.highAdmin, (o) => (o.docs || []).length === 0, (o) => o.smeFit === undefined, (o) => !o.described, (o) => o.awardsFunding === false, (o) => (o.soft || []).length > 3])
  sorted.filter(f).slice(0, 3).forEach(add);
const KEEP = ["id", "title", "sourceSystem", "program", "status", "deadline", "intensity", "fundingMin", "fundingMax", "partnerShare", "consortium", "smeFit", "highAdmin", "awardsFunding", "goals", "goalScores", "described", "docs", "hard", "soft", "sectors"];
const subset = [...pick.values()].sort((a, b) => a.id.localeCompare(b.id)).map((o) => Object.fromEntries(KEEP.filter((k) => k in o).map((k) => [k, o[k]])));
fs.writeFileSync(OUT + "/catalog.json", JSON.stringify(subset, null, 1));

const expected = cases.map((c, ci) => {
  const results = {}; const details = { en: {}, hu: {} };
  for (const o of subset) {
    const full = all.find((x) => x.id === o.id);
    // The prototype read `consortium_ready` only from the profile; the intended (and PHP) behaviour reads a per-call answer, then a global one, then the profile.
    const ready = c.answers[o.id + ":consortium_ready"] ?? c.answers["consortium_ready"];
    const prof = normalizeProfile({ ...(c.profile ?? DEMO_PROFILE), ...(ready !== undefined ? { consortium_ready: ready } : {}) });
    const js = hunterScore(full, prof, c.answers, ref);
    const factors = js.factors ? Object.fromEntries(explainScore(full, prof, js, "en").map((e) => [e.key, e.value])) : {};
    results[o.id] = { score: js.score, verdict: js.elig.status, blocked: js.blocked, estimated: js.estimated, daysLeft: js.elig.days, factors, failedRules: js.elig.checks.filter((x) => x.status === "fail").length };
    if (ci === 0 || ci === 3) for (const lang of ["en", "hu"]) if (js.factors) details[lang][o.id] = Object.fromEntries(explainScore(full, prof, js, lang).map((e) => [e.key, [e.label, e.detail]]));
  }
  return { name: c.name, profile: c.profile, answers: c.answers, results, details: ci === 0 || ci === 3 ? details : undefined };
});
fs.writeFileSync(OUT + "/expected.json", JSON.stringify({ referenceDate: "2026-09-21", cases: expected }, null, 1));
console.log(`catalog subset: ${subset.length} calls; cases: ${expected.length}; scored results: ${expected.reduce((n, c) => n + Object.values(c.results).filter((r) => r.score != null).length, 0)}`);
