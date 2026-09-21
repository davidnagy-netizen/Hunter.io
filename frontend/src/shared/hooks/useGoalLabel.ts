import { useMetaQuery } from "@/shared/api/meta.queries";
import { useLang } from "./useFormat";

/** A development goal's name in the active language, from the reference data; an id it doesn't know is shown as-is (also while that data loads). */
export function useGoalLabel(): (id: string) => string {
  const goals = useMetaQuery().data?.reference.goals;
  const lang = useLang();
  return (id) => {
    const goal = goals?.find((g) => g.id === id);
    return goal ? (lang === "en" ? goal.label_en : goal.label) : id;
  };
}
