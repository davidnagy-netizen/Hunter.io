import { useTranslation } from "react-i18next";
import { useLang } from "@/shared/hooks/useFormat";
import type { VocabEntry } from "../types/crm.types";
import "../i18n";

/** A stage dropdown — the touch-friendly, keyboard-friendly way to move a contact (dragging is the mouse shortcut). */
export function StageSelect({ value, stages, onChange, className = "" }: { value: string; stages: VocabEntry[]; onChange: (stage: string) => void; className?: string }) {
  const { t } = useTranslation("crm");
  const lang = useLang();
  return (
    <select
      value={value}
      aria-label={t("card.stage")}
      onChange={(event) => onChange(event.target.value)}
      className={["rounded-md border border-line-strong bg-surface px-2 py-1.5 text-xs", className].join(" ")}
    >
      {stages.map((stage) => (
        <option key={stage.id} value={stage.id}>
          {lang === "en" ? stage.label_en : stage.label_hu}
        </option>
      ))}
    </select>
  );
}
