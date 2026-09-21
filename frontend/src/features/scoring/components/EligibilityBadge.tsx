import { useTranslation } from "react-i18next";
import { Badge, type BadgeTone } from "@/shared/components";
import type { EligibilityStatus } from "../types/scoring.types";
import "../i18n";

/** The mapping `shared/components/Badge` deliberately doesn't own: verdict → tone. */
const VERDICT_TONE: Record<EligibilityStatus, BadgeTone> = {
  ELIGIBLE: "green",
  CONDITIONAL: "amber",
  INSUFFICIENT_DATA: "slate",
  NOT_ELIGIBLE: "red",
};

export function EligibilityBadge({ status }: { status: EligibilityStatus }) {
  const { t } = useTranslation("scoring");
  return <Badge tone={VERDICT_TONE[status]}>{t(`verdict.${status}`)}</Badge>;
}
