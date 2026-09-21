import { useTranslation } from "react-i18next";
import { Panel, PageHead } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { groupByMonth } from "../domain/calendar";
import { RELEVANT_SCORE } from "../domain/shortlist";
import { useOpportunitiesData } from "../hooks/useOpportunitiesData";
import { CatalogStatus } from "./CatalogStatus";
import { DeadlineRow } from "./DeadlineRow";
import { TeaserCard } from "./TeaserCard";
import { UpsellBlock } from "./UpsellBlock";
import "../i18n";

/**
 * Submission deadlines by month, for the matches worth acting on (Fundor Score
 * 70+). A deadline is itself paid data — a date plus a grant figure identifies
 * a call — so a gated account sees only the urgent teasers.
 */
export function CalendarPage() {
  const { t } = useTranslation("opportunities");
  const { month } = useFormat();
  const { isLoading, error, gated, teasers, lockedTotal, eligible } = useOpportunitiesData();
  const months = groupByMonth(eligible.filter((r) => (r.score ?? 0) >= RELEVANT_SCORE));

  return (
    <>
      <PageHead title={t("calendar.title")}>{gated ? t("calendar.gatedSubtitle") : t("calendar.subtitle")}</PageHead>
      <CatalogStatus isLoading={isLoading} error={error} />

      {!isLoading && !error ? (
        gated ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">{t(teasers.length ? "teaser.note" : "teaser.noteEmpty")}</p>
            {teasers
              .filter((x) => x.closingSoon)
              .map((teaser) => (
                <TeaserCard key={teaser.ref} teaser={teaser} />
              ))}
            <UpsellBlock lockedCount={lockedTotal} />
          </div>
        ) : months.length ? (
          <div className="flex flex-col gap-4">
            {months.map((m) => (
              <Panel key={m.key}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">{month(m.year, m.month)}</h2>
                  <span className="text-sm text-muted">
                    {t("calendar.deadlines", { count: m.items.length })}
                    {m.urgent ? ` · ${t("calendar.urgent", { n: m.urgent })}` : ""}
                  </span>
                </div>
                <ul className="-mx-3">
                  {m.items.map((item) => (
                    <DeadlineRow key={item.id} item={item} />
                  ))}
                </ul>
              </Panel>
            ))}
            <p className="text-xs text-muted">{t("calendar.notice")}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">{t("calendar.empty")}</p>
        )
      ) : null}
    </>
  );
}
