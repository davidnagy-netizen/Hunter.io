/**
 * Deterministic eligibility engine.
 *
 * The engine filters; the ranking layer only explains. A verdict here is never
 * a judgement call — it is the result of evaluating declarative rules of the
 * form {field, op, value} against the company profile. When a required field is
 * unknown the engine says so rather than guessing, which is what makes the
 * output safe to act on.
 */

export const DEFAULT_REFERENCE_DATE = new Date("2026-09-07");

export function daysToDeadline(opp, referenceDate = DEFAULT_REFERENCE_DATE) {
  const deadline = new Date(opp.deadline);
  return Math.round((deadline - new Date(referenceDate)) / 86400000);
}

export function getField(profile, field, oppId, adHocAnswers = {}) {
  const key = oppId + ":" + field;
  if (adHocAnswers[key] !== undefined) return adHocAnswers[key];
  // An answer given without a call prefix applies to every call that asks the
  // same question — the user should not be asked about de minimis nine times.
  if (adHocAnswers[field] !== undefined) return adHocAnswers[field];
  return profile ? profile[field] : undefined;
}

export function checkRule(val, op, target) {
  if (val === undefined || val === null) return "unknown";
  switch (op) {
    case "between":
      return val >= target[0] && val <= target[1] ? "pass" : "fail";
    case "in":
      return target.includes(val) ? "pass" : "fail";
    case "not_in":
      return !target.includes(val) ? "pass" : "fail";
    case ">=":
      return val >= target ? "pass" : "fail";
    case "<=":
      return val <= target ? "pass" : "fail";
    case "==":
      return val === target ? "pass" : "fail";
    case "includes_any":
      return Array.isArray(val) && val.some((v) => target.includes(v)) ? "pass" : "fail";
    default:
      return "unknown";
  }
}

/** Rules carry either a single `label` or a bilingual pair. */
export function ruleLabel(rule, lang = "hu") {
  if (lang === "en") return rule.label_en || rule.label || rule.label_hu || "";
  return rule.label_hu || rule.label || rule.label_en || "";
}

/** The follow-up question for a rule whose field is unknown, if it has one. */
export function ruleQuestion(rule, lang = "hu") {
  const q = rule.quiz;
  if (!q) return null;
  return {
    field: rule.field,
    question: lang === "en" ? q.q_en || q.q : q.q_hu || q.q,
    options: (q.opts || []).map((o) => ({
      text: lang === "en" ? o.t_en || o.t : o.t_hu || o.t,
      value: o.v,
    })),
  };
}

export function evaluateEligibility(opp, profile, adHocAnswers = {}, referenceDate = DEFAULT_REFERENCE_DATE) {
  const checks = (opp.hard || []).map((rule) => {
    const val = getField(profile, rule.field, opp.id, adHocAnswers);
    return { rule, status: checkRule(val, rule.op, rule.value), value: val };
  });

  const anyFail = checks.some((c) => c.status === "fail");
  const anyUnknown = checks.some((c) => c.status === "unknown");

  const days = daysToDeadline(opp, referenceDate);
  const conditions = [];
  if (opp.intensity < 1) {
    conditions.push({
      type: "own",
      text_hu: `${Math.round((1 - opp.intensity) * 100)}% saját forrás szükséges`,
      text_en: `${Math.round((1 - opp.intensity) * 100)}% own contribution required`,
    });
  }
  if (days > 0 && days <= 14) {
    conditions.push({
      type: "deadline",
      text_hu: `Közeli határidő – ${days} nap van a beadásig`,
      text_en: `Deadline approaching – ${days} days left to submit`,
    });
  }
  if (opp.highAdmin) {
    conditions.push({
      type: "admin",
      text_hu: "Magas adminisztrációs teher (angol nyelvű, összetett anyag)",
      text_en: "High administrative burden (English-language, complex submission)",
    });
  }
  // Surfaced as a condition rather than a silent rejection: a company without
  // partners today can still build a consortium before the deadline.
  if (opp.consortium?.required) {
    conditions.push({
      type: "consortium",
      text_hu: `Konzorcium kell: min. ${opp.consortium.minPartners} partner, ${opp.consortium.minCountries} országból`,
      text_en: `Consortium required: at least ${opp.consortium.minPartners} partners from ${opp.consortium.minCountries} countries`,
    });
  }
  if (opp.awardsFunding === false) {
    conditions.push({
      type: "no_funding",
      text_hu: "Ez a felhívás nem vissza nem térítendő támogatás (díj vagy minősítés)",
      text_en: "This call does not award a grant (it is a prize or a quality label)",
    });
  }

  let status;
  if (anyFail) status = "NOT_ELIGIBLE";
  else if (anyUnknown) status = "INSUFFICIENT_DATA";
  else if (conditions.length) status = "CONDITIONAL";
  else status = "ELIGIBLE";

  return { status, checks, conditions, days };
}

/**
 * The questions that would resolve an INSUFFICIENT_DATA verdict, in the order
 * worth asking. Only rules that carry a quiz can be answered inline; the rest
 * point back to the profile.
 */
export function openQuestions(elig, lang = "hu") {
  return elig.checks
    .filter((c) => c.status === "unknown")
    .map((c) => ruleQuestion(c.rule, lang) || { field: c.rule.field, question: null, options: [] });
}
