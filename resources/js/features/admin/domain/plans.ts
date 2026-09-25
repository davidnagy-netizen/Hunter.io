import type { Plan } from "@/features/authentication/types/auth.types";
import type { Lang } from "@/lib/format";

/** A plan's display name in the given language; an id the plan list doesn't know is shown as-is. */
export function planLabel(plans: Plan[], id: string | undefined | null, lang: Lang): string {
  if (!id) return "—";
  const plan = plans.find((p) => p.id === id);
  if (!plan) return id;
  return lang === "en" ? plan.label_en : plan.label_hu;
}
