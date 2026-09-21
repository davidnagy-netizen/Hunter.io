import { useTranslation } from "react-i18next";
import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";
import type { CardModel } from "../domain/cardModel";
import { useRuleValueFormatter } from "../hooks/useRuleValueFormatter";
import { OpportunityCardView } from "./OpportunityCardView";
import "../i18n";

/** A call from the catalog, scored by the server. */
export function OpportunityCard({ item }: { item: ScoredOpportunity }) {
  const { t } = useTranslation("opportunities");
  const formatValue = useRuleValueFormatter();

  const failed = item.blocked ? item.checks.find((c) => c.status === "fail") : undefined;
  const model: CardModel = {
    id: item.id,
    program: item.program,
    title: item.title,
    deadline: item.deadline,
    daysLeft: item.daysLeft ?? 0,
    intensity: item.intensity,
    fundingMin: item.fundingMin,
    fundingMax: item.fundingMax,
    isNew: item.isNew,
    sourceUrl: item.sourceUrl,
    score: item.score,
    band: item.band,
    blocked: item.blocked,
    verdict: item.verdict,
    exclusionReason: failed
      ? `${failed.label} (${t("card.yours", { value: formatValue(failed.field, failed.yourValue) })})`
      : (item.blockedReasons[0] ?? null),
  };
  return <OpportunityCardView model={model} />;
}
