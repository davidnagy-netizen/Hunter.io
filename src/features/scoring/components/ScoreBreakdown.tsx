import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import { explainScore } from "../domain/engine";
import type { FundorScoreResult, Opportunity } from "../types/scoring.types";
import "../i18n";

/**
 * The five weighted factors behind a score, each expandable into the
 * concrete reason it landed where it did. The text comes from the engine's
 * own `explainScore` (bilingual, built from the company's actual values) —
 * nothing here re-derives it. Renders nothing for a blocked call.
 */
export function ScoreBreakdown({
  opp,
  profile,
  result,
}: {
  opp: Opportunity;
  profile: CompanyProfile | null;
  result: FundorScoreResult;
}) {
  const { t, i18n } = useTranslation("scoring");
  const baseId = useId();
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!result.factors) return null;
  const factors = explainScore(opp, profile, result, i18n.language === "en" ? "en" : "hu");

  return (
    <ul className="flex flex-col gap-1">
      {factors.map((f) => {
        const open = openKey === f.key;
        const panelId = `${baseId}-${f.key}`;
        return (
          <li key={f.key} className="rounded-md border border-line">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenKey(open ? null : f.key)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
              <span className="w-40 shrink-0 text-sm font-medium text-text">
                {f.label} <span className="font-normal text-muted">{t("breakdown.weight", { pct: Math.round(f.weight * 100) })}</span>
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${f.value}%` }} />
              </span>
              <span className="w-10 text-right text-sm tabular-nums text-text">{f.value}%</span>
            </button>
            {open ? (
              <p id={panelId} className="border-t border-line px-3 py-2.5 text-sm text-muted">
                {f.detail}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
