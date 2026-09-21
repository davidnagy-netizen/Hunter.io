import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/hooks/useFormat";
import { EligibilityQuestion } from "@/features/scoring/components/EligibilityQuestion";
import { ruleLabel } from "@/features/scoring/domain/engine";
import type { EligibilityResult, Opportunity } from "@/features/scoring/types/scoring.types";
import { useRuleValueFormatter } from "../hooks/useRuleValueFormatter";
import { CheckLine } from "./CheckLine";
import "../i18n";

/**
 * The explanation, in three groups: what passes, what to watch, and what the
 * engine could not decide (each of which asks its question inline — the
 * "never guess, ask" loop).
 */
export function WhyBlocks({
  opp,
  elig,
  projectValueHuf,
}: {
  opp: Opportunity;
  elig: EligibilityResult;
  projectValueHuf: number;
}) {
  const { t } = useTranslation("opportunities");
  const { huf, lang } = useFormat();
  const formatValue = useRuleValueFormatter();
  const yours = (field: string, value: unknown) => t("detail.why.yours", { value: formatValue(field, value) });

  const passed = elig.checks.filter((c) => c.status === "pass");
  const unknown = elig.checks.filter((c) => c.status === "unknown");

  return (
    <div className="flex flex-col gap-5">
      {passed.length ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-text">{t("detail.why.pass")}</h3>
          <ul className="flex flex-col gap-2">
            {passed.map((c) => (
              <CheckLine key={c.rule.field + c.rule.op} status="pass" yours={yours(c.rule.field, c.value)}>
                {ruleLabel(c.rule, lang)}
              </CheckLine>
            ))}
          </ul>
        </section>
      ) : null}

      {elig.conditions.length ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-text">{t("detail.why.watch")}</h3>
          <ul className="flex flex-col gap-2">
            {elig.conditions.map((c) => (
              <CheckLine
                key={c.type}
                status="watch"
                yours={c.type === "own" ? `~${huf(projectValueHuf * (1 - opp.intensity))}` : undefined}
              >
                {lang === "en" ? c.text_en : c.text_hu}
              </CheckLine>
            ))}
          </ul>
        </section>
      ) : null}

      {unknown.length ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-text">{t("detail.why.unknown")}</h3>
          <ul className="flex flex-col gap-3">
            {unknown.map((c) => (
              <li key={c.rule.field + c.rule.op}>
                <ul>
                  <CheckLine status="unknown">{ruleLabel(c.rule, lang)}</CheckLine>
                </ul>
                <EligibilityQuestion oppId={opp.id} rule={c.rule} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
