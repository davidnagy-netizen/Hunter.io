/**
 * Catalog builder.
 *
 * Reads the raw scraper output, normalizes it, merges in the curated Hungarian
 * national calls, and writes a single catalog file that the server loads at
 * startup. Keeping this as a build step rather than doing it per request means
 * the API answers from memory and the expensive text classification runs once.
 *
 *   node src/pipeline/buildCatalog.js [--raw data/raw] [--out server/data/catalog.json]
 *                                     [--today YYYY-MM-DD] [--eur-huf 395] [--live]
 *                                     [--curated]
 *
 * `--live`    refreshes the EUR/HUF rate from the ECB before building.
 * `--curated` includes the nine hand-authored Hungarian demonstration entries.
 *             Off by default, so what this builds matches what a hosted
 *             instance serves (see server/refresh.js).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeEuBatch, DEFAULT_EUR_HUF } from "./normalizeEu.js";
import { OPPS as HU_NATIONAL_CALLS } from "../data/mockGrants.js";
import { buildBenchmarks } from "./kohesioBenchmarks.js";
import { adaptNationalCall } from "./adaptNational.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
      // A truncated final line is expected if a scrape was interrupted.
    }
  }
  return out;
}

/**
 * Live EUR/HUF from the European Central Bank's daily reference feed.
 * Falls back to the pinned rate — a stale rate is far better than a failed build.
 */
export async function fetchEurHuf(fallback = DEFAULT_EUR_HUF) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`ECB returned HTTP ${res.status}`);
    const xml = await res.text();
    const m = xml.match(/currency=['"]HUF['"]\s+rate=['"]([\d.]+)['"]/);
    if (!m) throw new Error("HUF rate not present in the ECB feed");
    const rate = Number(m[1]);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("HUF rate not a usable number");
    return { rate, source: "ECB daily reference rates", fetchedAt: new Date().toISOString() };
  } catch (err) {
    return { rate: fallback, source: `pinned fallback (${err.message})`, fetchedAt: null };
  }
}

export async function buildCatalog(options = {}) {
  const rawDir = options.rawDir || path.join(ROOT, "data", "raw");
  const today = options.today || new Date().toISOString().slice(0, 10);

  const fx = options.live
    ? await fetchEurHuf(options.eurHuf || DEFAULT_EUR_HUF)
    : { rate: options.eurHuf || DEFAULT_EUR_HUF, source: "pinned rate", fetchedAt: null };

  const openRaw = readJsonl(path.join(rawDir, "eu_open_grants.jsonl"));
  const forthcomingRaw = readJsonl(path.join(rawDir, "eu_forthcoming_grants.jsonl"));

  const open = normalizeEuBatch(openRaw, { today, eurHuf: fx.rate });
  const forthcoming = normalizeEuBatch(forthcomingRaw, { today, eurHuf: fx.rate });
  forthcoming.opportunities.forEach((o) => {
    o.status = "forthcoming";
  });

  // An id present in both feeds is the same topic seen at two moments; the open
  // record is the current truth.
  const byId = new Map();
  for (const opp of open.opportunities) byId.set(opp.id, opp);
  for (const opp of forthcoming.opportunities) if (!byId.has(opp.id)) byId.set(opp.id, opp);
  if (options.includeCurated) {
    for (const call of HU_NATIONAL_CALLS) {
      const adapted = adaptNationalCall(call);
      if (adapted.deadline >= today) byId.set(adapted.id, adapted);
    }
  }

  const opportunities = [...byId.values()].sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)));

  const benchmarks = buildBenchmarks(readJsonl(path.join(rawDir, "kohesio_hungary.jsonl")));

  const bySource = {};
  const byProgramme = {};
  for (const o of opportunities) {
    bySource[o.sourceSystem] = (bySource[o.sourceSystem] || 0) + 1;
    byProgramme[o.programShort] = (byProgramme[o.programShort] || 0) + 1;
  }

  return {
    meta: {
      builtAt: new Date().toISOString(),
      referenceDate: today,
      eurHuf: fx.rate,
      eurHufSource: fx.source,
      eurHufFetchedAt: fx.fetchedAt,
      counts: {
        total: opportunities.length,
        open: opportunities.filter((o) => o.status === "open").length,
        forthcoming: opportunities.filter((o) => o.status === "forthcoming").length,
        bySource,
        byProgramme,
      },
      ingestion: {
        euOpen: open.report,
        euForthcoming: forthcoming.report,
        huNational: { input: HU_NATIONAL_CALLS.length, included: Boolean(options.includeCurated) },
      },
      sources: [
        {
          id: "EU_FUNDING_TENDERS",
          name: "European Commission — Funding & Tenders Opportunities Portal (SEDIA)",
          url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home",
        },
        {
          id: "KOHESIO",
          name: "European Commission — Kohesio (funded cohesion-policy projects)",
          url: "https://kohesio.ec.europa.eu/",
        },
        {
          id: "HU_NATIONAL",
          name: "Hungarian national programmes (curated reference entries)",
          url: "https://www.palyazat.gov.hu/",
        },
      ],
    },
    opportunities,
    benchmarks,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
  };

  const outFile = path.resolve(ROOT, arg("out", path.join("server", "data", "catalog.json")));
  const catalog = await buildCatalog({
    rawDir: path.resolve(ROOT, arg("raw", path.join("data", "raw"))),
    today: arg("today", new Date().toISOString().slice(0, 10)),
    eurHuf: Number(arg("eur-huf", DEFAULT_EUR_HUF)),
    live: argv.includes("--live"),
    includeCurated: argv.includes("--curated"),
  });

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(catalog), "utf8");

  const c = catalog.meta.counts;
  console.log(`Catalog written to ${path.relative(ROOT, outFile)}`);
  console.log(`  opportunities : ${c.total} (${c.open} open, ${c.forthcoming} forthcoming)`);
  console.log(`  by source     : ${Object.entries(c.bySource).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`  programmes    : ${Object.entries(c.byProgramme).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`  EUR/HUF       : ${catalog.meta.eurHuf} (${catalog.meta.eurHufSource})`);
  console.log(`  EU open feed  : ${JSON.stringify(catalog.meta.ingestion.euOpen)}`);
  console.log(`  benchmarks    : ${catalog.benchmarks.projectCount} Hungarian funded projects`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error("Catalog build failed:", err);
    process.exit(1);
  });
}
