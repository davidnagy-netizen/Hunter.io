import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { RELEVANT_SCORE } from "@/features/opportunities/domain/shortlist";
import { useOpportunitiesData } from "@/features/opportunities/hooks/useOpportunitiesData";
import { CatalogStatus } from "@/features/opportunities/components/CatalogStatus";
import { OpportunityCard } from "@/features/opportunities/components/OpportunityCard";
import { TeaserCard } from "@/features/opportunities/components/TeaserCard";
import { UpcomingDeadlines } from "@/features/opportunities/components/UpcomingDeadlines";
import { UpsellBlock } from "@/features/opportunities/components/UpsellBlock";
import "@/features/opportunities/i18n/index";
import { PageHead } from "@/components/index";

function StatTile({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className="font-display text-3xl font-semibold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation("opportunities");
  const { profile } = useCompanyProfile();
  const { isLoading, error, gated, teasers, lockedTotal, eligible, stats } = useOpportunitiesData();
  const [showAll, setShowAll] = useState(false);

  const shown = showAll ? eligible : eligible.filter((r) => (r.score ?? 0) >= RELEVANT_SCORE);

  return (
    <>
      <PageHead title={t("dashboard.welcome", { company: profile?.company ?? "" })}>
        {t("dashboard.found", { n: stats.total })}
      </PageHead>
      <CatalogStatus isLoading={isLoading} error={error} />

      {!isLoading && !error ? (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile value={stats.total} label={t("dashboard.tiles.total")} />
            <StatTile value={stats.strong} label={t("dashboard.tiles.strong")} color="var(--color-green)" />
            <StatTile value={stats.closingSoon} label={t("dashboard.tiles.closing")} color="var(--color-amber)" />
            <StatTile value={stats.needsAttention} label={t("dashboard.tiles.attention")} color="var(--color-gold-deep)" />
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t("dashboard.recommended")}</h2>
            {!gated ? (
              <button type="button" className="text-sm font-medium text-gold-deep" onClick={() => setShowAll((v) => !v)}>
                {showAll ? t("dashboard.only70") : t("dashboard.lower")}
              </button>
            ) : null}
          </div>

          {gated ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted">{t(teasers.length ? "teaser.note" : "teaser.noteEmpty")}</p>
              {teasers.map((teaser) => (
                <TeaserCard key={teaser.ref} teaser={teaser} />
              ))}
              <UpsellBlock lockedCount={lockedTotal} />
            </div>
          ) : shown.length ? (
            <>
              <div className="flex flex-col gap-3">
                {shown.map((item) => (
                  <OpportunityCard key={item.id} item={item} />
                ))}
              </div>
              <UpcomingDeadlines relevant={eligible.filter((r) => (r.score ?? 0) >= RELEVANT_SCORE)} />
            </>
          ) : (
            <p className="text-sm text-muted">{t("dashboard.empty")}</p>
          )}
        </>
      ) : null}
    </>
  );
}
