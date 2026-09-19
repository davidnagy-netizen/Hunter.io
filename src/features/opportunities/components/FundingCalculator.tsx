import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TextField } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import type { Opportunity } from "@/features/scoring/types/scoring.types";
import { calculateGrant } from "../domain/calculator";
import "../i18n";

/**
 * A live "what would I actually get" calculator. Deliberately plain state,
 * not a React Hook Form form: there is nothing to submit or validate — the
 * result is derived on every keystroke.
 */
export function FundingCalculator({ opp, initialValueHuf }: { opp: Opportunity; initialValueHuf: number }) {
  const { t } = useTranslation("opportunities");
  const { huf } = useFormat();
  const [value, setValue] = useState(String(initialValueHuf));
  const result = calculateGrant(opp, Number(value) || 0);

  const hint = opp.partnerShare
    ? t("detail.calculator.hintShare", { max: huf(opp.partnerShare.maxHuf) })
    : opp.fundingMax
      ? t("detail.calculator.hintCeiling", { max: huf(opp.fundingMax) })
      : t("detail.calculator.hintNone");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <TextField
          label={t("detail.calculator.value")}
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <TextField
          label={t("detail.calculator.intensity")}
          value={`${Math.round(opp.intensity * 100)}%`}
          disabled
          readOnly
        />
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <dl aria-live="polite" className="flex flex-col justify-center gap-3 rounded-md bg-paper p-4">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-muted">{t("detail.calculator.expected")}</dt>
          <dd className="font-display text-xl font-semibold text-green">{huf(result.grantHuf)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="text-sm text-muted">{t("detail.calculator.own")}</dt>
          <dd className="font-display text-xl font-semibold">{huf(result.ownContributionHuf)}</dd>
        </div>
      </dl>
    </div>
  );
}
