import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/hooks/useFormat";
import { ruleLabel } from "@/features/scoring/domain/engine";
import type { RankedOpportunity } from "@/features/scoring/types/scoring.types";
import type { CardModel } from "../domain/cardModel";
import { useRuleValueFormatter } from "../hooks/useRuleValueFormatter";
import { OpportunityCardView } from "./OpportunityCardView";
import "../i18n";

/** A call from the full catalog, scored in the browser. */
export function OpportunityCard({ item }: { item: RankedOpportunity }) {
  const { opp, res } = item;
  const { t } = useTranslation("opportunities");
  const { lang } = useFormat();
  const formatValue = useRuleValueFormatter();

  const failed = res.blocked ? res.elig.checks.find((c) => c.status === "fail") : undefined;
  const model: CardModel = {
    id: opp.id,
    program: opp.program,
    title: opp.title,
    deadline: opp.deadline,
    daysLeft: res.elig.days,
    intensity: opp.intensity,
    fundingMin: opp.fundingMin,
    fundingMax: opp.fundingMax,
    isNew: opp.isNew,
    sourceUrl: opp.sourceUrl,
    score: res.score,
    blocked: res.blocked,
    verdict: res.elig.status,
    exclusionReason: failed
      ? `${ruleLabel(failed.rule, lang)} (${t("card.yours", { value: formatValue(failed.rule.field, failed.value) })})`
      : null,
  };
  return <OpportunityCardView model={model} />;
}
