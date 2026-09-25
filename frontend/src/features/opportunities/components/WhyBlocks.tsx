import { useTranslation } from "react-i18next";
import { EligibilityQuestion } from "@/shared/components/EligibilityQuestion";
import type { ScoredOpportunity } from "@/shared/types/scoring.types";
import { useRuleValueFormatter } from "../hooks/useRuleValueFormatter";
import { CheckLine } from "./CheckLine";
import "../i18n";

/**
 * The explanation, in three groups: what passes, what to watch, and what the
 * server could not decide (each of which asks its question inline — the
 * "never guess, ask" loop). Every sentence was worded by the server in the
 * active language; this only lays them out.
 */
export function WhyBlocks({ opp }: { opp: ScoredOpportunity }) {
  const { t } = useTranslation("opportunities");
  const formatValue = useRuleValueFormatter();
  const yours = (field: string, value: unknown) => t("detail.why.yours", { value: formatValue(field, value) });

  const passed = opp.checks.filter((c) => c.status === "pass");
  const unknown = opp.checks.filter((c) => c.status === "unknown");

  return (
    <div className="flex flex-col gap-5">
      {passed.length ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-text">{t("detail.why.pass")}</h3>
          <ul className="flex flex-col gap-2">
            {passed.map((c) => (
              <CheckLine key={c.field + c.operator} status="pass" yours={yours(c.field, c.yourValue)}>
                {c.label}
              </CheckLine>
            ))}
          </ul>
        </section>
      ) : null}

      {opp.conditions.length ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-text">{t("detail.why.watch")}</h3>
          <ul className="flex flex-col gap-2">
            {opp.conditions.map((text) => (
              <CheckLine key={text} status="watch">
                {text}
              </CheckLine>
            ))}
          </ul>
        </section>
      ) : null}

      {unknown.length ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-text">{t("detail.why.unknown")}</h3>
          <ul className="flex flex-col gap-3">
            {unknown.map((c) => {
              const question = opp.questions.find((q) => q.field === c.field);
              return (
                <li key={c.field + c.operator}>
                  <ul>
                    <CheckLine status="unknown">{c.label}</CheckLine>
                  </ul>
                  {question ? <EligibilityQuestion oppId={opp.id} question={question} /> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
