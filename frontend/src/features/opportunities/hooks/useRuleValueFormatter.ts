import { useTranslation } from "react-i18next";
import { useMetaQuery } from "@/shared/api/meta.queries";
import { useFormat } from "@/shared/hooks/useFormat";

/**
 * Renders the company's own value for a rule ("28 employees", "Pest county")
 * so every explanation can say "(yours: …)" — the engine's rules are
 * `{field, op, value}`, so turning a value into words is presentation and
 * belongs here, not in the engine.
 */
export function useRuleValueFormatter() {
  const { t } = useTranslation(["opportunities", "profile"]);
  const meta = useMetaQuery();
  const { huf, lang } = useFormat();
  const goals = meta.data?.reference.goals ?? [];
  const regions = meta.data?.reference.regions ?? [];

  const goalLabel = (id: string) => {
    const goal = goals.find((g) => g.id === id);
    return goal ? (lang === "en" ? goal.label_en || goal.label : goal.label) : id;
  };

  return (field: string, value: unknown): string => {
    if (value === undefined || value === null) return "—";
    if (field === "employees") return t("opportunities:value.employees", { n: Number(value) });
    if (field === "closed_business_years") return t("opportunities:value.closedYears", { n: Number(value) });
    if (field === "investment_value") return huf(Number(value));
    if (field === "teaor") return `TEÁOR ${String(value)}`;
    if (field === "region") {
      const region = regions.find((r) => r.code === value);
      return region ? t(`profile:regions.${region.code}`, { defaultValue: region.name }) : String(value);
    }
    if (field === "de_minimis_ok") return t(value ? "opportunities:value.deMinimisYes" : "opportunities:value.deMinimisNo");
    if (typeof value === "boolean") return t(value ? "opportunities:value.yes" : "opportunities:value.no");
    if (Array.isArray(value)) return value.map((v) => goalLabel(String(v))).join(", ");
    return String(value);
  };
}
