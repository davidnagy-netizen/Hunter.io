import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/hooks/useFormat";
import { useGoalLabel } from "@/shared/hooks/useGoalLabel";
import { describeValue } from "../lib/profileChanges";
import type { ProfileVersionChange } from "../types/admin.types";
import "@/features/admin/i18n";

/** "Employees: 28 → 45" lines for one profile version. Goal ids are shown by name. */
export function ProfileChanges({ changes }: { changes: ProfileVersionChange[] }) {
  const { t } = useTranslation("admin");
  const { huf } = useFormat();
  const goalLabel = useGoalLabel();

  const formatters = {
    huf,
    yes: t("yes"),
    no: t("no"),
    goalLabel,
  };

  return (
    <ul className="mt-2 flex flex-col gap-1 text-xs">
      {changes.map((change) => (
        <li key={change.field} className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-text">{t(`fields.${change.field}`, { defaultValue: change.field })}</span>
          <span className="text-muted line-through">{describeValue(change.field, change.from, formatters)}</span>
          <span className="text-muted">→</span>
          <span className="font-medium text-text">{describeValue(change.field, change.to, formatters)}</span>
        </li>
      ))}
    </ul>
  );
}
