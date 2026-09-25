import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/hooks/useFormat";
import { useGoalLabel } from "@/shared/hooks/useGoalLabel";
import type { CompanyProfile } from "@/shared/types/profile.types";
import type { ScoredOpportunity } from "@/shared/types/scoring.types";
import { draftFigures, type DraftChapter } from "../domain/draft";
import "../i18n";

/**
 * The three-chapter template, filled with the company's and the call's real
 * figures, in the active language. Derived on every render rather than stored:
 * switching language re-words it, and changing the profile or the call
 * changes it, with nothing to keep in sync.
 */
export function useDraftChapters(profile: CompanyProfile, opp: ScoredOpportunity): DraftChapter[] {
  const { t } = useTranslation("plus");
  const { huf } = useFormat();
  const goalLabel = useGoalLabel();
  const f = draftFigures(profile, opp);

  return [
    {
      title: t("chapters.executive.title"),
      body: t("chapters.executive.body", { company: f.company, employees: f.employees, county: f.county, opp: opp.title, total: huf(f.total), grant: huf(f.grant), intensity: f.intensityPct }),
    },
    {
      title: t("chapters.technical.title"),
      body: f.teaor
        ? t("chapters.technical.body", { goals: f.goalIds.map(goalLabel).join(", "), teaor: f.teaor })
        : t("chapters.technical.bodyNoTeaor", { goals: f.goalIds.map(goalLabel).join(", ") }),
    },
    {
      title: t("chapters.budget.title"),
      body: f.docs.length ? t("chapters.budget.body", { own: huf(f.own), docs: f.docs.join("; ") }) : t("chapters.budget.bodyNoDocs", { own: huf(f.own) }),
    },
  ];
}
