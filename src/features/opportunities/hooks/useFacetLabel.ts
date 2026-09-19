import { useTranslation } from "react-i18next";
import { useMetaQuery } from "@/shared/api/meta.queries";
import { useLang } from "@/shared/hooks/useFormat";
import type { ListFacet } from "../domain/searchState";
import "../i18n";

export type FacetKey = ListFacet | "consortium";

/** Turns a facet value into wording, shared by the facet buttons and the active-filter chips. */
export function useFacetLabel() {
  const { t } = useTranslation("opportunities");
  const meta = useMetaQuery();
  const lang = useLang();

  return (facet: FacetKey, value: string): string => {
    if (facet === "program") return meta.data?.labels.programmes[value] ?? value;
    if (facet === "actionCode") return meta.data?.labels.actions[value] ?? value;
    if (facet === "goals") {
      const goal = meta.data?.reference.goals.find((g) => g.id === value);
      return goal ? (lang === "en" ? goal.label_en || goal.label : goal.label) : value;
    }
    return t(`search.consortium.${value}`, { defaultValue: value });
  };
}
