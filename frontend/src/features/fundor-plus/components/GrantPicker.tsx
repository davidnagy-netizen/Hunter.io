import { useTranslation } from "react-i18next";
import { Badge, Panel } from "@/shared/components";
import type { ScoredOpportunity } from "@/shared/types/scoring.types";
import "../i18n";

/** The calls that fit this company, best first. Pick one to work on. */
export function GrantPicker({ options, selectedId, onSelect }: { options: ScoredOpportunity[]; selectedId: string; onSelect: (id: string) => void }) {
  const { t } = useTranslation("plus");

  return (
    <Panel title={t("workspace.select")} className="print:hidden">
      <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {options.map((opp) => {
          const selected = opp.id === selectedId;
          return (
            <li key={opp.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(opp.id)}
                className={[
                  "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm",
                  selected ? "border-ink bg-ink text-white" : "border-line-strong bg-transparent text-text hover:bg-paper",
                ].join(" ")}
              >
                <span className="min-w-0 truncate">{opp.title}</span>
                {opp.score != null ? <Badge tone="green">{opp.score}</Badge> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
