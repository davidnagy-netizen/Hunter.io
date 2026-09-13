/**
 * Hunter Score.
 *
 *   Score = 0.35·Eligibility + 0.25·ProjectFit + 0.15·FundingSize
 *         + 0.15·Timing      + 0.10·Feasibility
 *
 * The weights and the five factors are the product specification and do not
 * change. What each factor knows how to read does: a hand-authored Hungarian
 * call carries a headcount band and a document list, while an EU call carries
 * an action type, a consortium requirement and a contribution range in euro.
 * Every extra signal below is read only when present, so an opportunity that
 * does not carry it scores exactly as it did before.
 */

import {
  evaluateEligibility,
  checkRule,
  getField,
  daysToDeadline,
  DEFAULT_REFERENCE_DATE,
} from "./eligibility.js";

export function factorEligibility(elig) {
  const c = elig.checks;
  if (!c.length) return 1;
  let s = 0;
  c.forEach((x) => (s += x.status === "pass" ? 1 : x.status === "unknown" ? 0.7 : 0));
  return s / c.length;
}

export function factorProjectFit(opp, profile, adHocAnswers = {}) {
  const goals = profile?.goals || [];
  const overlap = (opp.goals || []).filter((g) => goals.includes(g)).length;
  const goalScore = opp.goals?.length ? overlap / opp.goals.length : 0;
  let softPass = 0;
  let softTot = 0;

  (opp.soft || []).forEach((r) => {
    softTot += r.weight;
    const val = r.field === "goals" ? goals : getField(profile, r.field, opp.id, adHocAnswers);
    if (checkRule(val, r.op, r.value) === "pass") softPass += r.weight;
  });

  const softScore = softTot ? softPass / softTot : goalScore;
  let base = 0.6 * goalScore + 0.4 * softScore;

  // Opportunities that went through thematic classification are held to a
  // stricter standard than the hand-authored national calls, because their soft
  // rules include non-thematic ones (funding preference, sector) that would
  // otherwise let a call with no thematic overlap at all still score in the
  // middle of the range. Theme is what "project fit" means, so theme dominates.
  if (opp.goalScores) {
    const thematic = opp.goals?.length
      ? goalScore
      : // A call whose full description matches none of the company's goals is
        // a genuine mismatch. One the portal published without a description is
        // merely unknown, and is not punished for the portal's gap.
        opp.described ? 0.1 : 0.3;
    base = 0.8 * thematic + 0.2 * softScore;
  }

  // How well the funding instrument itself suits this kind of applicant. An
  // Innovation Action and an ERC grant can share a theme while being worlds
  // apart in whether a commercial SME should spend three months on the bid.
  if (opp.smeFit === undefined || !profile?.orgType) return base;
  const instrumentFit = profile.orgType === "sme" || profile.orgType === "large" ? opp.smeFit : 1;
  return base * (0.75 + 0.25 * instrumentFit);
}

export function factorFundingSize(opp, profile) {
  const v = profile?.investment_value || 0;

  // EU topics do not always publish a contribution range. Saying "we don't
  // know" scores neutrally; inventing a band would bias the ranking.
  if (!opp.fundingMin && !opp.fundingMax) return 0.5;

  // On a consortium call the company budgets for its own work package, so the
  // comparison is against its realistic share — not against a grant that funds
  // eight organisations.
  if (opp.partnerShare) {
    const { minHuf, maxHuf } = opp.partnerShare;
    const support = Math.min(v * (opp.intensity || 0.5), maxHuf);
    let band;
    if (v >= minHuf && v <= maxHuf * 2) band = 1;
    else if (v < minHuf) band = Math.max(0.2, v / minHuf);
    else band = Math.max(0.4, (maxHuf * 2) / v);
    const meaningful = support >= 3e6 ? 1 : support / 3e6;
    return Math.min(1, 0.7 * band + 0.3 * meaningful * (0.6 + (opp.intensity || 0.5) * 0.4));
  }

  const fundingMax = opp.fundingMax || opp.fundingMin;
  const fundingMin = opp.fundingMin || 0;

  const support = Math.min(v * (opp.intensity || 0.5), fundingMax);
  let band;
  if (v >= fundingMin && v <= fundingMax * 2) {
    band = 1;
  } else if (v < fundingMin) {
    band = fundingMin ? Math.max(0.2, v / fundingMin) : 0.5;
  } else {
    band = Math.max(0.4, (fundingMax * 2) / v);
  }
  const meaningful = support >= 3e6 ? 1 : support / 3e6;
  return Math.min(1, 0.7 * band + 0.3 * meaningful * (0.6 + (opp.intensity || 0.5) * 0.4));
}

export function factorTiming(opp, referenceDate = DEFAULT_REFERENCE_DATE) {
  const d = daysToDeadline(opp, referenceDate);
  if (d <= 0) return 0;
  if (d < 14) return 0.45;
  if (d < 45) return 0.72;
  if (d < 120) return 0.92;
  if (d <= 240) return 1;
  return 0.84;
}

export function factorFeasibility(opp, profile) {
  let f = 1;
  f -= (1 - (opp.intensity || 0.5)) * 0.4;
  f -= (Math.min((opp.docs || []).length, 6) / 6) * 0.28;
  if (opp.highAdmin) f -= 0.18;

  // Building a three-country consortium is the single largest practical barrier
  // for a Hungarian SME that has never done it, and a non-issue for one that
  // already has partners — so the penalty depends on the company, not the call.
  if (opp.consortium?.required) {
    const ready = profile?.consortium_ready;
    if (ready === true) f -= 0.04;
    else if (ready === false) f -= 0.22;
    else f -= 0.12;
  }

  // First-time applicants to directly managed EU funding carry a real learning
  // cost on top of the paperwork itself.
  if (opp.sourceSystem === "EU_FUNDING_TENDERS" && profile?.eu_experience === false) f -= 0.06;

  return Math.max(0.2, f);
}

export function hunterScore(opp, profile, adHocAnswers = {}, referenceDate = DEFAULT_REFERENCE_DATE) {
  const elig = evaluateEligibility(opp, profile, adHocAnswers, referenceDate);
  if (elig.status === "NOT_ELIGIBLE") {
    return { elig, blocked: true, score: null, factors: null, estimated: false };
  }

  const f = {
    elig: factorEligibility(elig),
    fit: factorProjectFit(opp, profile, adHocAnswers),
    size: factorFundingSize(opp, profile),
    timing: factorTiming(opp, referenceDate),
    feas: factorFeasibility(opp, profile),
  };

  const raw = 0.35 * f.elig + 0.25 * f.fit + 0.15 * f.size + 0.15 * f.timing + 0.1 * f.feas;
  const score = Math.round(raw * 100);

  return {
    elig,
    blocked: false,
    score,
    factors: f,
    estimated: elig.status === "INSUFFICIENT_DATA",
  };
}

export function scoreBand(score) {
  if (score >= 85) return { key: "strong", lbl_hu: "Nagyon erős lehetőség", lbl_en: "Very strong opportunity", color: "var(--green)" };
  if (score >= 70) return { key: "relevant", lbl_hu: "Releváns lehetőség", lbl_en: "Relevant opportunity", color: "var(--gold-deep)" };
  if (score >= 50) return { key: "conditional", lbl_hu: "Feltételes lehetőség", lbl_en: "Conditional opportunity", color: "var(--amber)" };
  return { key: "low", lbl_hu: "Alacsony relevancia", lbl_en: "Low relevance", color: "var(--slate)" };
}

export function rankedOpps(profile, grantList, adHocAnswers = {}, referenceDate = DEFAULT_REFERENCE_DATE) {
  return grantList
    .map((o) => ({ opp: o, res: hunterScore(o, profile, adHocAnswers, referenceDate) }))
    .filter((x) => daysToDeadline(x.opp, referenceDate) > 0)
    .sort((a, b) => {
      if (a.res.blocked !== b.res.blocked) return a.res.blocked ? 1 : -1;
      return (b.res.score || 0) - (a.res.score || 0);
    });
}

const millions = (n) => Math.round((n || 0) / 1e6);

/**
 * Says what the funding figure was actually compared against — which differs
 * between a call the company would win outright and one where it would hold a
 * single work package.
 */
function fundingSizeDetail(opp, profile, en) {
  const mine = millions(profile?.investment_value);

  if (opp.partnerShare) {
    const { minHuf, typicalHuf, maxHuf } = opp.partnerShare;
    return en
      ? `The ${millions(opp.fundingMax || opp.fundingMin)}M HUF grant covers the whole consortium. One partner's share is typically around ${millions(typicalHuf)}M HUF (${millions(minHuf)}–${millions(maxHuf)}M), against your ${mine}M HUF project.`
      : `A ${millions(opp.fundingMax || opp.fundingMin)} M Ft támogatás a teljes konzorciumra szól. Egy partner részesedése jellemzően ${millions(typicalHuf)} M Ft körül van (${millions(minHuf)}–${millions(maxHuf)} M Ft), a te projekted ${mine} M Ft.`;
  }

  if (opp.fundingMin || opp.fundingMax) {
    return en
      ? `Grant per project ${millions(opp.fundingMin)}–${millions(opp.fundingMax)}M HUF against your ${mine}M HUF project.`
      : `A felhívás projektenkénti támogatása ${millions(opp.fundingMin)}–${millions(opp.fundingMax)} M Ft, a te projekted ${mine} M Ft.`;
  }

  return en
    ? "The call does not publish a contribution range, so this factor is scored neutrally."
    : "A felhívás nem közöl támogatási sávot, ezért ez a tényező semleges értéket kap.";
}

/**
 * Per-factor explanation for the opportunity detail view: what each factor
 * scored, and the concrete reason it landed there.
 */
export function explainScore(opp, profile, res, lang = "hu") {
  if (!res.factors) return [];
  const pct = (x) => Math.round(x * 100);
  const en = lang === "en";
  const f = res.factors;
  const passed = res.elig.checks.filter((c) => c.status === "pass").length;
  const total = res.elig.checks.length;

  return [
    {
      key: "elig",
      weight: 0.35,
      value: pct(f.elig),
      label: en ? "Eligibility" : "Jogosultság",
      detail: en
        ? `${passed} of ${total} hard criteria satisfied by your profile.`
        : `${total} kötelező feltételből ${passed} teljesül a cégprofilod alapján.`,
    },
    {
      key: "fit",
      weight: 0.25,
      value: pct(f.fit),
      label: en ? "Project fit" : "Projekt-illeszkedés",
      detail: en
        ? `Call themes: ${(opp.goals || []).join(", ") || "not classified"}. Your goals: ${(profile?.goals || []).join(", ") || "none set"}.`
        : `A felhívás témái: ${(opp.goals || []).join(", ") || "nincs besorolva"}. A te céljaid: ${(profile?.goals || []).join(", ") || "nincs megadva"}.`,
    },
    {
      key: "size",
      weight: 0.15,
      value: pct(f.size),
      label: en ? "Funding size" : "Támogatás mérete",
      detail: fundingSizeDetail(opp, profile, en),
    },
    {
      key: "timing",
      weight: 0.15,
      value: pct(f.timing),
      label: en ? "Timing" : "Időzítés",
      detail: en ? `${res.elig.days} days remain until the deadline.` : `${res.elig.days} nap van a beadási határidőig.`,
    },
    {
      key: "feas",
      weight: 0.1,
      value: pct(f.feas),
      label: en ? "Feasibility" : "Megvalósíthatóság",
      detail: en
        ? `${Math.round((1 - (opp.intensity || 0)) * 100)}% own contribution, ${(opp.docs || []).length} required annexes${opp.consortium?.required ? `, consortium of ${opp.consortium.minPartners}+ partners` : ""}.`
        : `${Math.round((1 - (opp.intensity || 0)) * 100)}% önerő, ${(opp.docs || []).length} kötelező melléklet${opp.consortium?.required ? `, ${opp.consortium.minPartners}+ partneres konzorcium` : ""}.`,
    },
  ];
}
