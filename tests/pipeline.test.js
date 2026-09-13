/**
 * Ingestion and search tests.
 *
 * These run against fixtures shaped exactly like the scraper's output, so they
 * cover the seams where real portal data tends to be awkward: missing budget
 * tables, stale "open" topics whose deadline passed years ago, multiple cut-off
 * dates, and calls whose text maps onto no development goal at all.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeEuRecord, normalizeEuBatch } from "../src/pipeline/normalizeEu.js";
import { buildBenchmarks, benchmarksFor } from "../src/pipeline/kohesioBenchmarks.js";
import { classifyGoals, inferSectors, sectorOfNace } from "../src/data/taxonomy.js";
import { resolveActionRules } from "../src/data/programmes.js";
import { buildIndex, runSearch, tokenize, matchesFilters } from "../src/engine/search.js";
import { normalizeProfile } from "../src/engine/profile.js";
import { hunterScore } from "../src/engine/scoring.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = "2026-09-11";

function euRecord(overrides = {}) {
  const metadata = {
    identifier: ["HORIZON-CL4-2026-TWIN-01"],
    callIdentifier: ["HORIZON-CL4-2026-TWIN"],
    callTitle: ["Digital and Industrial Transition"],
    title: ["Artificial intelligence for advanced manufacturing production lines"],
    descriptionByte: ["<p>Machine learning and digitalisation for industrial equipment and factory automation.</p>"],
    frameworkProgramme: ["43108390"],
    type: ["1"],
    status: ["31094502"],
    startDate: ["2026-05-05T00:00:00.000+0000"],
    deadlineDate: ["2027-01-20T00:00:00.000+0000"],
    deadlineModel: ["single-stage"],
    keywords: ["Artificial intelligence", "Advanced manufacturing"],
    crossCuttingPriorities: ["AI", "DigitalAgenda"],
    typesOfAction: ["HORIZON Innovation Actions"],
    url: ["https://ec.europa.eu/topic-details/HORIZON-CL4-2026-TWIN-01"],
    links: [
      JSON.stringify([
        { criterionCode: "HORIZON-IA", criterionDescription: "HORIZON Innovation Actions", mgaCode: "HORIZON-AG", url: "https://ec.europa.eu/submission/1" },
      ]),
    ],
    budgetOverview: [
      JSON.stringify({
        budgetTopicActionMap: {
          1: [
            {
              action: "HORIZON-CL4-2026-TWIN-01 - HORIZON-IA HORIZON Innovation Actions",
              expectedGrants: 4,
              minContribution: 4000000,
              maxContribution: 6000000,
              budgetYearMap: { 2026: "24000000" },
              deadlineDates: ["2027-01-20"],
            },
          ],
        },
      }),
    ],
    ...overrides.metadata,
  };
  return { url: "https://ec.europa.eu/x", ...overrides, metadata };
}

test("normalizes a SEDIA grant record into a Hunter opportunity", () => {
  const opp = normalizeEuRecord(euRecord(), { eurHuf: 400 });

  assert.equal(opp.id, "eu-horizon-cl4-2026-twin-01");
  assert.equal(opp.sourceSystem, "EU_FUNDING_TENDERS");
  assert.equal(opp.programShort, "HORIZON");
  assert.equal(opp.program, "EU – Horizon Europe");
  assert.equal(opp.actionCode, "HORIZON-IA");
  assert.equal(opp.deadline, "2027-01-20");

  // Innovation Actions reimburse for-profit applicants at 70%.
  assert.equal(opp.intensity, 0.7);
  assert.deepEqual(opp.consortium, { required: true, minPartners: 3, minCountries: 3 });

  // The budget row is matched to this topic and converted into HUF.
  assert.equal(opp.budget.minContributionEur, 4000000);
  assert.equal(opp.budget.maxContributionEur, 6000000);
  assert.equal(opp.fundingMax, 6000000 * 400);
  assert.equal(opp.budget.expectedGrants, 4);

  assert.ok(opp.goals.includes("ai"), "the call is about AI");
  assert.ok(opp.hungary.eligible, "a Hungarian entity may apply to a Union programme");
  assert.ok(opp.docs.length > 0);
  assert.ok(opp.sourceUrl, "the official call must stay linkable");
});

test("consortium calls are judged on the partner's share, not the whole grant", () => {
  const consortium = normalizeEuRecord(euRecord(), { eurHuf: 400 });

  assert.ok(consortium.partnerShare, "a consortium call carries a partner-share estimate");
  assert.ok(consortium.partnerShare.minHuf < consortium.partnerShare.typicalHuf);
  assert.ok(consortium.partnerShare.typicalHuf < consortium.partnerShare.maxHuf);
  assert.ok(
    consortium.partnerShare.maxHuf <= consortium.fundingMax / 3,
    "no single partner is credited with more than an even split of the minimum consortium"
  );

  // The full project value must not become a hard bar: a 30M HUF SME project
  // is a perfectly normal work package inside a 2.4bn HUF consortium grant.
  const budgetGate = consortium.hard.find((r) => r.field === "investment_value");
  assert.equal(budgetGate, undefined, "consortium calls must not gate on total project size");

  // A single-applicant call is the opposite case and does gate.
  const solo = normalizeEuRecord(
    euRecord({
      metadata: {
        identifier: ["DIGITAL-2026-SME-01"],
        frameworkProgramme: ["43152860"],
        links: [JSON.stringify([{ criterionCode: "DIGITAL-SIMPLE", criterionDescription: "Simple Grant" }])],
        budgetOverview: [
          JSON.stringify({
            budgetTopicActionMap: {
              1: [{ action: "DIGITAL-2026-SME-01 - DIGITAL-SIMPLE Simple Grant", minContribution: 500000, maxContribution: 900000, budgetYearMap: { 2026: "9000000" } }],
            },
          }),
        ],
      },
    }),
    { eurHuf: 400 }
  );

  assert.equal(solo.consortium.required, false);
  assert.equal(solo.partnerShare, null);
  const soloGate = solo.hard.find((r) => r.field === "investment_value");
  assert.ok(soloGate, "single-applicant calls do gate on project size");
  assert.equal(soloGate.value, 500000 * 400);
});

test("batch ingestion drops expired topics and records why", () => {
  const stale = euRecord({
    metadata: { identifier: ["HORIZON-CL5-2023-OLD-01"], deadlineDate: ["2023-09-21T00:00:00.000+0000"], budgetOverview: undefined, links: undefined },
  });
  const live = euRecord();
  const broken = { metadata: { title: ["No identifier at all"] } };

  const { opportunities, report } = normalizeEuBatch([live, stale, broken, live], { today: TODAY, eurHuf: 400 });

  assert.equal(report.input, 4);
  assert.equal(report.expired, 1, "the portal keeps stale 'open' topics; ingestion must not");
  assert.equal(report.unusable, 1, "a record without an identifier cannot be used");
  assert.equal(report.duplicate, 1);
  assert.equal(report.kept, 1);
  assert.equal(opportunities.length, 1);
});

test("a topic with several cut-offs keeps the last one as its deadline", () => {
  const opp = normalizeEuRecord(
    euRecord({
      metadata: {
        deadlineDate: ["2026-10-01T00:00:00.000+0000", "2027-03-15T00:00:00.000+0000"],
        deadlineModel: ["multiple cut-off"],
      },
    }),
    { eurHuf: 400 }
  );
  assert.equal(opp.deadline, "2027-03-15");
  assert.ok(opp.deadlines.length >= 2);
});

test("a call with no published budget still normalizes", () => {
  const opp = normalizeEuRecord(euRecord({ metadata: { budgetOverview: undefined } }), { eurHuf: 400 });
  assert.equal(opp.fundingMin, null);
  assert.equal(opp.fundingMax, null);
  assert.equal(opp.partnerShare, null, "no budget means no share can be estimated");

  // Scoring must stay neutral rather than punish the call for the gap.
  const profile = normalizeProfile({ employees: 28, teaor: "28", goals: ["ai"], investment_value: 30e6, country: "HU" });
  const res = hunterScore(opp, profile, { consortium_ready: true }, new Date(TODAY));
  assert.ok(res.score > 0 && res.score <= 100);
});

test("thematic classification keeps the leading themes and rejects passing mentions", () => {
  const focused = classifyGoals({
    title: "Hydrogen production and energy storage for industrial decarbonisation",
    description: "Renewable energy, hydrogen and energy efficiency in manufacturing.",
    keywords: ["hydrogen", "energy storage"],
  });
  assert.ok(focused.goals.includes("energy"));
  assert.ok(focused.goals.length <= 5, "a call is not about everything");

  // One incidental word must not turn an agriculture call into a digital one.
  const incidental = classifyGoals({
    title: "Agroecology and soil health in European farming systems",
    description: "Rural development and food systems research, with a digital data component.",
    keywords: ["agriculture", "soil"],
  });
  assert.ok(incidental.goals.includes("agriculture"));
  assert.equal(incidental.goals[0], "agriculture", "the dominant theme leads");

  // A Commission cross-cutting tag alone is supporting evidence, not proof.
  const tagOnly = classifyGoals({ title: "Governance of European research policy", crossCutting: ["AI"] });
  assert.ok(!tagOnly.goals.includes("ai"), "one broad tag must not qualify a theme on its own");
});

test("sector inference stays narrow, and NACE maps to a sector", () => {
  const sectors = inferSectors(["energy", "digitalization"]);
  assert.ok(sectors.includes("energy"));
  assert.ok(!sectors.includes("tourism"), "an industrial energy call is not a tourism opportunity");

  assert.equal(sectorOfNace("28"), "manufacturing");
  assert.equal(sectorOfNace("62"), "it");
  assert.equal(sectorOfNace("01"), "agriculture");
  assert.equal(sectorOfNace(undefined), null);
});

test("action rules resolve exactly, by prefix, and by programme", () => {
  assert.equal(resolveActionRules("HORIZON-RIA", "HORIZON").rate, 1.0);
  assert.equal(resolveActionRules("HORIZON-IA", "HORIZON").rate, 0.7);
  assert.equal(resolveActionRules("HORIZON-EIC-ACC", "HORIZON").minPartners, 1, "the EIC Accelerator is for a single SME");
  assert.equal(resolveActionRules("HORIZON-JU-IA-VARIANT", "HORIZON").resolvedFrom, "action-prefix");
  assert.equal(resolveActionRules(null, "LIFE").resolvedFrom, "programme");
  assert.equal(resolveActionRules("TOTALLY-UNKNOWN", "NOT-A-PROGRAMME").resolvedFrom, "programme");
});

test("profile normalization derives what it can and leaves the rest unknown", () => {
  const p = normalizeProfile({ employees: 28, county: "Pest", teaor: "28", goals: ["ai"] });
  assert.equal(p.country, "HU");
  assert.equal(p.orgType, "sme");
  assert.equal(p.sizeClass, "small");
  assert.equal(p.sector, "manufacturing");
  assert.equal(p.region, "HU12", "county resolves to its NUTS-2 region");
  assert.equal(p.consortium_ready, undefined, "an unknown field stays unknown so the engine asks");

  assert.equal(normalizeProfile({ employees: 900 }).orgType, "large");
  assert.equal(normalizeProfile({ employees: 900, orgType: "research" }).orgType, "research", "an explicit value wins");
});

test("search ranks by relevance, filters, and reports facets over the filtered set", () => {
  const docs = [
    normalizeEuRecord(euRecord(), { eurHuf: 400 }),
    normalizeEuRecord(
      euRecord({
        metadata: {
          identifier: ["LIFE-2026-CET-BUILD"],
          callIdentifier: ["LIFE-2026-CET"],
          callTitle: ["Clean Energy Transition"],
          frameworkProgramme: ["43252405"],
          title: ["Hydrogen and clean energy transition in buildings"],
          descriptionByte: ["<p>Energy efficiency, renewable energy and hydrogen for the built environment.</p>"],
          keywords: ["hydrogen", "energy"],
          crossCuttingPriorities: [],
          links: [JSON.stringify([{ criterionCode: "LIFE-PJG", criterionDescription: "LIFE Project Grant" }])],
          budgetOverview: [
            JSON.stringify({
              budgetTopicActionMap: { 1: [{ action: "LIFE-2026-CET-BUILD - LIFE-PJG LIFE Project Grant", minContribution: 1000000, maxContribution: 2000000, budgetYearMap: { 2026: "8000000" } }] },
            }),
          ],
        },
      }),
      { eurHuf: 400 }
    ),
  ];
  const index = buildIndex(docs);

  const hydrogen = runSearch(index, { q: "hydrogen" });
  assert.equal(hydrogen.total, 1);
  assert.equal(hydrogen.results[0].opp.programShort, "LIFE");

  // Prefix matching: a user typing into a search box does not finish the word.
  assert.equal(runSearch(index, { q: "hydro" }).total, 1);

  // Identifiers are searchable, which is how people arrive from the portal.
  assert.equal(runSearch(index, { q: "HORIZON-CL4-2026-TWIN-01" }).total, 1);

  const all = runSearch(index, {});
  assert.equal(all.total, 2);
  assert.equal(all.sort, "deadline", "with no text and no scorer, deadline order is the useful default");

  const lifeOnly = runSearch(index, { filters: { program: ["LIFE"] } });
  assert.equal(lifeOnly.total, 1);
  assert.deepEqual(
    lifeOnly.facets.program.map((f) => f.value),
    ["LIFE"],
    "facet counts describe the filtered set, so no filter leads to a dead end"
  );

  const solo = runSearch(index, { filters: { consortium: "solo" } });
  assert.equal(solo.total, 1);
  assert.equal(solo.results[0].opp.programShort, "LIFE");

  assert.equal(runSearch(index, { q: "nothing whatsoever matches this" }).total, 0);
});

test("search scores against the company and never ranks a blocked call first", () => {
  const docs = [normalizeEuRecord(euRecord(), { eurHuf: 400 })];
  const index = buildIndex(docs);
  const profile = normalizeProfile({ employees: 28, teaor: "28", county: "Pest", goals: ["ai", "machinery"], investment_value: 30e6 });

  const scorer = (opp) => hunterScore(opp, profile, { consortium_ready: false }, new Date(TODAY));
  const res = runSearch(index, { scorer });
  assert.equal(res.results[0].blocked, true, "declining a consortium blocks a consortium-only call");

  const eligibleOnly = runSearch(index, { scorer, filters: { eligibleOnly: true } });
  assert.equal(eligibleOnly.total, 0);

  const willing = runSearch(index, { scorer: (opp) => hunterScore(opp, profile, { consortium_ready: true }, new Date(TODAY)) });
  assert.equal(willing.results[0].blocked, false);
  assert.ok(willing.results[0].score > 0);
});

test("filters combine as AND across fields and OR within a field", () => {
  const opp = normalizeEuRecord(euRecord(), { eurHuf: 400 });
  assert.equal(matchesFilters(opp, { program: ["HORIZON", "LIFE"] }), true);
  assert.equal(matchesFilters(opp, { program: ["LIFE"] }), false);
  assert.equal(matchesFilters(opp, { program: ["HORIZON"], consortium: "solo" }), false);
  assert.equal(matchesFilters(opp, { deadlineTo: "2026-12-31" }), false);
  assert.equal(matchesFilters(opp, { deadlineFrom: "2026-01-01" }), true);
  assert.equal(matchesFilters(opp, { orgType: ["sme"] }), true);
});

test("the tokenizer folds Hungarian accents and drops noise", () => {
  assert.deepEqual(tokenize("Energiahatékonyság és HIDROGÉN"), ["energiahatekonysag", "hidrogen"]);
  assert.deepEqual(tokenize("the and of"), []);
});

test("Kohesio benchmarks aggregate Hungarian projects only", () => {
  const raw = [
    { item: "Q1", label: "Solar plant for a factory", countryCode: ["HU"], budget: "+1000000.0", euBudget: "+600000.0", cofinancingRate: 60, funds: [{ id: "ERDF" }], categoryLabels: ["Renewable energy: solar"], description_raw: "Photovoltaic installation and energy efficiency" },
    { item: "Q2", label: "Energy efficiency retrofit", countryCode: ["HU"], budget: "+2000000.0", euBudget: "+1400000.0", cofinancingRate: 70, funds: [{ id: "ERDF" }], categoryLabels: ["Energy efficiency"], description_raw: "Renewable energy and energy efficiency for industry" },
    { item: "Q3", label: "Heat pump programme", countryCode: ["HU"], budget: "+3000000.0", euBudget: "+1800000.0", cofinancingRate: 60, funds: [{ id: "CF" }], categoryLabels: ["Energy"], description_raw: "Heat pump and energy storage rollout, renewable energy" },
    { item: "Q4", label: "Romanian motorway", countryCode: ["RO"], budget: "+900000000.0", euBudget: "+500000000.0", cofinancingRate: 55, funds: [{ id: "CF" }], categoryLabels: ["Motorways"], description_raw: "Transport infrastructure" },
  ];

  const b = buildBenchmarks(raw);
  assert.equal(b.projectCount, 3, "a Romanian motorway is not a comparable for a Hungarian applicant");
  assert.equal(b.overall.budgetEur.median, 2000000);
  assert.equal(b.byFund.ERDF.projectCount, 2);

  const forEnergy = benchmarksFor(b, { goals: ["energy"] });
  assert.ok(forEnergy, "an energy call should find energy comparables");
  assert.equal(forEnergy.goal, "energy");
  assert.equal(forEnergy.projectCount, 3);

  assert.equal(benchmarksFor(b, { goals: ["culture"] }), null, "no comparables is reported honestly, not averaged away");
  assert.equal(benchmarksFor({ projectCount: 0 }, { goals: ["energy"] }), null);
});

test("the built catalog on disk is coherent", (t) => {
  const file = path.join(ROOT, "server", "data", "catalog.json");
  if (!fs.existsSync(file)) {
    t.skip("no catalog built yet — run `npm run build:catalog`");
    return;
  }
  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));

  assert.ok(catalog.opportunities.length > 0, "the catalog should not be empty");
  assert.ok(catalog.meta.eurHuf > 0, "a EUR/HUF rate is required to express grants in HUF");

  const ids = new Set();
  for (const opp of catalog.opportunities) {
    assert.ok(opp.id, "every opportunity needs an id");
    assert.ok(!ids.has(opp.id), `duplicate id ${opp.id}`);
    ids.add(opp.id);

    assert.match(opp.deadline, /^\d{4}-\d{2}-\d{2}$/, `${opp.id} needs an ISO deadline`);
    assert.ok(Array.isArray(opp.hard), `${opp.id} needs hard rules`);
    assert.ok(opp.intensity >= 0 && opp.intensity <= 1, `${opp.id} has an impossible funding rate`);
    assert.ok(opp.program, `${opp.id} needs a programme name`);

    if (opp.sourceSystem === "EU_FUNDING_TENDERS") {
      assert.ok(opp.hungary.eligible, `${opp.id} should be open to Hungarian entities`);
      assert.ok(
        opp.hard.some((r) => r.field === "country"),
        `${opp.id} should state its country rule explicitly`
      );
    }
  }
});
