import { useTranslation } from "react-i18next";
import { Badge } from "@/components";
import { useFormat } from "@/composables/useFormat";
import type { LoanItem } from "../hooks/useLoans";
import "../i18n";

/**
 * One reviewed loan product, as information: its terms and where they come from. Deliberately no score, rank or
 * "for you" wording — personalised evaluation is blocked until the MNB legal opinion (CR-02).
 */
export function LoanCard({ loan }: { loan: LoanItem }) {
  const { t } = useTranslation("loans");
  const { date } = useFormat();
  const dates = [
    { label: t("card.effectiveFrom"), value: date(loan.effective_from_date) },
    { label: t("card.deadline"), value: date(loan.deadline) },
    { label: t("card.lastVerified"), value: date(loan.last_verified_date) },
  ];

  return (
    <article className="rounded-lg border border-line bg-surface p-5 shadow-card">
      <Badge tone="blue">{loan.typeLabel}</Badge>
      <p className="mt-3 text-xs text-muted">{loan.program}</p>
      <h2 className="break-words font-display text-lg font-semibold text-ink">{loan.title}</h2>
      <p className="mt-3 whitespace-pre-line break-words text-sm text-text">{loan.terms}</p>
      <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
        {dates.map((d) => (
          <div key={d.label}>
            <dt className="text-xs text-muted">{d.label}</dt>
            <dd className="font-medium">{d.value}</dd>
          </div>
        ))}
        <div className="sm:col-span-3">
          <dt className="text-xs text-muted">{t("card.source")}</dt>
          <dd className="break-words font-medium">{loan.source_document_reference}</dd>
        </div>
      </dl>
    </article>
  );
}
