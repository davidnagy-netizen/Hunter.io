/**
 * Thematic taxonomy.
 *
 * EU calls describe themselves in free text plus a loose keyword list. The
 * company profile, on the other hand, speaks Hunter's fixed vocabulary of
 * development goals and industry sectors. This module is the bridge: it turns
 * call text into the same vocabulary so `ProjectFit` compares like with like.
 *
 * Matching is weighted rather than boolean — a phrase in the title counts for
 * more than the same phrase buried in the scope section — so a call about
 * "digital manufacturing" ranks ahead of one that merely mentions digitisation
 * in passing.
 */

/**
 * Goal -> the terms that signal it.
 *
 *   strong  unambiguous evidence of the goal
 *   weak    supporting evidence; several weak hits are needed to qualify
 */
export const GOAL_SIGNALS = {
  digitalization: {
    strong: ["digitalisation", "digitalization", "digital transformation", "digitisation", "digital adoption", "erp", "industry 4.0", "industry 5.0", "smart factory", "digital twin"],
    weak: ["digital", "software", "platform", "automation", "sensor", "iot", "internet of things"],
  },
  it: {
    strong: ["cloud computing", "software development", "high performance computing", "edge computing", "data space", "interoperability", "open source software"],
    weak: ["cloud", "software", "computing", "data platform", "infrastructure", "system integration", "api"],
  },
  ai: {
    strong: ["artificial intelligence", "machine learning", "deep learning", "generative ai", "large language model", "neural network", "ai act", "trustworthy ai"],
    weak: ["ai", "algorithm", "predictive", "autonomous", "robotic", "data analytics"],
  },
  cybersecurity: {
    strong: ["cybersecurity", "cyber security", "cyber resilience", "network security", "cyber threat", "post-quantum cryptography"],
    weak: ["security", "privacy", "encryption", "resilience", "nis2"],
  },
  machinery: {
    strong: ["manufacturing", "production line", "industrial equipment", "advanced manufacturing", "machine tool",
             "process industry", "additive manufacturing", "advanced materials", "smart textiles", "industrial process"],
    weak: ["equipment", "machinery", "factory", "production", "hardware", "prototype", "pilot line", "materials", "textile", "component"],
  },
  energy: {
    strong: ["energy efficiency", "renewable energy", "photovoltaic", "solar", "wind energy", "hydrogen", "decarbonisation", "energy storage", "heat pump", "battery"],
    weak: ["energy", "electricity", "grid", "emission", "carbon", "fuel", "thermal"],
  },
  building: {
    strong: ["building renovation", "built environment", "construction sector", "energy performance of buildings", "smart building", "infrastructure development"],
    weak: ["building", "construction", "renovation", "facility", "premises", "site"],
  },
  rnd: {
    strong: ["research and innovation", "applied research", "technology readiness", "proof of concept", "experimental development", "pilot demonstration"],
    weak: ["research", "scientific", "laboratory", "validation", "demonstrator", "trl"],
  },
  innovation: {
    strong: ["breakthrough innovation", "market uptake", "commercialisation", "scale-up", "deep tech", "innovation ecosystem", "technology transfer"],
    weak: ["innovation", "innovative", "novel", "startup", "spin-off", "disruptive"],
  },
  employment: {
    strong: ["job creation", "employment", "labour market", "workforce", "social economy", "quality jobs"],
    weak: ["jobs", "employer", "recruitment", "worker", "staff"],
  },
  training: {
    strong: ["vocational training", "upskilling", "reskilling", "skills development", "digital skills", "capacity building", "lifelong learning"],
    weak: ["training", "education", "curriculum", "learning", "course", "competence"],
  },
  export: {
    strong: ["internationalisation", "market access", "export", "global value chain", "cross-border cooperation", "international expansion"],
    weak: ["international", "global", "trade", "market entry", "partnership"],
  },
  agriculture: {
    strong: ["agriculture", "agri-food", "farming", "agroecology", "rural development", "food system", "aquaculture", "forestry", "bioeconomy"],
    weak: ["food", "farm", "crop", "livestock", "soil", "rural", "biomass"],
  },
  circular: {
    strong: ["circular economy", "waste management", "recycling", "resource efficiency", "secondary raw material", "remanufacturing", "eco-design"],
    weak: ["waste", "recycle", "reuse", "material", "sustainable production"],
  },
  mobility: {
    strong: ["sustainable mobility", "transport", "logistics", "electric vehicle", "rail", "maritime transport", "aviation", "connected mobility"],
    weak: ["vehicle", "fleet", "traffic", "shipping", "freight", "port"],
  },
  health: {
    strong: ["healthcare", "medical device", "clinical", "public health", "pharmaceutical", "diagnostics", "personalised medicine"],
    weak: ["health", "patient", "disease", "care", "hospital", "therapy"],
  },
  environment: {
    strong: ["biodiversity", "climate adaptation", "nature restoration", "pollution", "water management", "ecosystem", "environmental protection"],
    weak: ["climate", "environment", "green", "nature", "water", "air quality"],
  },
  culture: {
    strong: ["cultural heritage", "creative sector", "audiovisual", "cultural and creative industries", "media literacy"],
    weak: ["culture", "heritage", "art", "media", "film", "museum"],
  },
  space: {
    strong: ["space technology", "satellite", "earth observation", "copernicus", "galileo", "egnss"],
    weak: ["space", "orbit", "navigation", "remote sensing"],
  },
  defence: {
    strong: ["defence capability", "military", "defence industry", "armament", "dual-use", "unmanned platform",
             "air-to-air refuelling", "interception", "ammunition", "multiple rocket launcher", "naval", "combat aircraft"],
    weak: ["defence", "security forces", "combat", "surveillance", "unmanned", "aircraft", "seabed", "turbofan", "missile"],
  },
  electronics: {
    strong: ["semiconductor", "chip design", "microelectronics", "power electronics", "photonics", "integrated circuit",
             "quantum computing", "quantum technology", "6g", "5g", "radio communication", "printed electronics", "chips joint undertaking"],
    weak: ["electronics", "chip", "wafer", "optical", "laser", "spectroscopy", "telecommunication", "antenna", "quantum"],
  },
  biotech: {
    strong: ["biotechnology", "bio-based", "biorefinery", "fermentation", "synthetic biology", "bioprocess",
             "biomanufacturing", "enzyme", "bio-based products"],
    weak: ["biological", "microbial", "protein", "cell culture", "bioeconomy"],
  },
  social: {
    strong: ["social inclusion", "gender equality", "child poverty", "civil society", "anti-discrimination",
             "social finance", "gender-based violence", "vulnerable groups", "democracy", "rule of law"],
    weak: ["inclusion", "equality", "poverty", "rights", "citizens", "community", "participation", "governance"],
  },
};

/**
 * Sector -> TEÁOR / NACE division prefixes, so a company's registered activity
 * can be matched against the thematic area of a call.
 */
export const SECTOR_NACE = {
  manufacturing: ["10", "11", "13", "14", "15", "16", "17", "18", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33"],
  it: ["58", "61", "62", "63"],
  energy: ["35", "36"],
  construction: ["41", "42", "43"],
  transport: ["49", "50", "51", "52", "53"],
  agriculture: ["01", "02", "03"],
  trade: ["45", "46", "47"],
  health: ["86", "87", "88", "21"],
  creative: ["59", "60", "90", "91"],
  services: ["69", "70", "71", "72", "73", "74", "78", "82"],
  tourism: ["55", "56", "79"],
  waste: ["37", "38", "39"],
  education: ["85"],
};

/**
 * Goals that define a sector, most defining first.
 *
 * Kept deliberately short. Themes such as digitalisation or innovation apply to
 * every sector, so listing them everywhere would make a call about industrial
 * heat pumps look relevant to hotels. Each sector names only the goals that a
 * call would have to address for that sector's companies to be its real
 * audience; broad themes appear only where they genuinely define the sector.
 */
export const SECTOR_GOAL_AFFINITY = {
  manufacturing: ["machinery", "electronics", "circular", "energy", "biotech"],
  it: ["it", "ai", "cybersecurity", "electronics", "digitalization"],
  energy: ["energy", "environment"],
  construction: ["building", "energy"],
  transport: ["mobility", "space"],
  agriculture: ["agriculture", "environment"],
  trade: ["export", "digitalization"],
  health: ["health"],
  creative: ["culture"],
  services: ["training", "employment", "digitalization"],
  tourism: ["culture"],
  waste: ["circular", "environment"],
  education: ["training", "employment", "social"],
};

/** SEDIA `crossCuttingPriorities` codes that map cleanly onto Hunter goals. */
const CROSS_CUTTING_GOALS = {
  AI: ["ai", "digitalization"],
  DigitalAgenda: ["digitalization", "it"],
  RePowerEU: ["energy"],
  NEB: ["building", "culture"],
  SocInnov: ["employment"],
  SocietalEngagement: ["employment"],
  EoscAndFairData: ["it", "rnd"],
  OCEAN: ["environment"],
  MultiActorApproach: ["agriculture"],
  CircularEconomy: ["circular"],
  SSH: ["social"],
  SocietalChallenges: ["social"],
  Gender: ["social"],
  ClimateChange: ["environment", "energy"],
  Biodiversity: ["environment"],
};

const STRONG_WEIGHT = 3;
const WEAK_WEIGHT = 1;
/**
 * A goal has to clear two bars to qualify: an absolute floor of evidence, and a
 * share of whatever the call's dominant theme scored. The relative bar is what
 * keeps a passing mention of "digital" in an agri-food call from turning that
 * call into a digitalisation opportunity. Calibrated against the 326 open calls
 * in the September 2026 snapshot, where the median dominant theme scores ~17.
 */
const QUALIFY_FLOOR = 8;
const QUALIFY_SHARE = 0.22;
/** Beyond this, extra themes describe the programme rather than the call. */
const MAX_GOALS = 5;
/**
 * Credit for a Commission cross-cutting priority tag. Deliberately below
 * QUALIFY_FLOOR: tags like `AI` or `DigitalAgenda` are applied broadly across
 * Horizon topics, so one on its own is supporting evidence, not proof that the
 * call is about that theme. Two tags, or one tag plus text evidence, qualify.
 */
const CROSS_CUTTING_CREDIT = 5;

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  // Word-boundary match so "ai" does not fire inside "air" or "chain".
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "g");
  let n = 0;
  while (re.exec(haystack) !== null) n += 1;
  return n;
}

/**
 * Scores every goal against the call's text.
 *
 * @param {{title?:string, summary?:string, description?:string, keywords?:string[], crossCutting?:string[]}} parts
 * @returns {{goals:string[], scores:Object<string,number>, evidence:Object<string,string[]>}}
 */
export function classifyGoals(parts = {}) {
  const title = (parts.title || "").toLowerCase();
  const keywords = (parts.keywords || []).join(" ").toLowerCase();
  const summary = (parts.summary || "").toLowerCase();
  const body = (parts.description || "").toLowerCase();

  // Title and keywords are declarations of intent; the body is supporting text.
  const zones = [
    { text: title, weight: 3 },
    { text: keywords, weight: 2.5 },
    { text: summary, weight: 1.5 },
    { text: body, weight: 1 },
  ];

  const scores = {};
  const evidence = {};

  for (const [goal, signals] of Object.entries(GOAL_SIGNALS)) {
    let score = 0;
    const hits = [];
    for (const zone of zones) {
      if (!zone.text) continue;
      for (const term of signals.strong) {
        const n = countOccurrences(zone.text, term);
        if (n) {
          score += Math.min(n, 3) * STRONG_WEIGHT * zone.weight;
          if (!hits.includes(term)) hits.push(term);
        }
      }
      for (const term of signals.weak) {
        const n = countOccurrences(zone.text, term);
        if (n) {
          score += Math.min(n, 3) * WEAK_WEIGHT * zone.weight;
          if (!hits.includes(term)) hits.push(term);
        }
      }
    }
    if (score > 0) {
      scores[goal] = Math.round(score * 10) / 10;
      evidence[goal] = hits.slice(0, 6);
    }
  }

  // Cross-cutting priority codes are curated by the Commission, so they count
  // as qualifying evidence on their own.
  // Credit each goal for cross-cutting tags at most once. Several tags often
  // imply the same theme — `AI` and `DigitalAgenda` both point at digitality —
  // and letting them stack would qualify "digitalisation" on tagging alone, on
  // roughly half of all Horizon topics.
  const tagged = new Set();
  for (const code of parts.crossCutting || []) {
    for (const goal of CROSS_CUTTING_GOALS[code] || []) {
      if (!tagged.has(goal)) {
        scores[goal] = (scores[goal] || 0) + CROSS_CUTTING_CREDIT;
        tagged.add(goal);
      }
      evidence[goal] = evidence[goal] || [];
      if (!evidence[goal].includes(code)) evidence[goal].push(code);
    }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = ranked.length ? ranked[0][1] : 0;
  const bar = Math.max(QUALIFY_FLOOR, top * QUALIFY_SHARE);
  const goals = ranked
    .filter(([, s]) => s >= bar)
    .slice(0, MAX_GOALS)
    .map(([g]) => g);

  return { goals, scores, evidence };
}

/** Sectors kept per call, before the relative cut-off is applied. */
const MAX_SECTORS = 4;

/**
 * Which NACE-based sectors a call speaks to, inferred from its goals.
 *
 * Sectors are ranked rather than collected: a sector that matches the call's
 * leading theme counts for much more than one reached through a trailing theme,
 * and only sectors close to the best match are kept. Collecting every sector
 * that touches any goal would tag an industrial energy call as relevant to
 * tourism, which is exactly the noise the ranking is there to remove.
 */
export function inferSectors(goals = []) {
  if (!goals.length) return [];

  // Weighted on both sides: how central the goal is to the call, times how
  // defining that goal is for the sector.
  const scored = Object.entries(SECTOR_GOAL_AFFINITY).map(([sector, affinities]) => {
    let score = 0;
    goals.forEach((goal, goalRank) => {
      const affRank = affinities.indexOf(goal);
      if (affRank >= 0) score += (1 / (goalRank + 1)) * (1 / (affRank + 1));
    });
    return { sector, score };
  });

  const best = Math.max(...scored.map((x) => x.score));
  if (best <= 0) return [];

  return scored
    .filter((x) => x.score >= best * 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SECTORS)
    .map((x) => x.sector);
}

/** The sector a company belongs to, from its TEÁOR/NACE division. */
export function sectorOfNace(teaor) {
  if (!teaor) return null;
  const div = String(teaor).padStart(2, "0").slice(0, 2);
  for (const [sector, divisions] of Object.entries(SECTOR_NACE)) {
    if (divisions.includes(div)) return sector;
  }
  return null;
}
