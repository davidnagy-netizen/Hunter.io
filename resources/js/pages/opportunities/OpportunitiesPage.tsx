import { useTranslation } from "react-i18next";
import { useOpportunitiesData } from "@/features/opportunities/hooks/useOpportunitiesData";
import { CatalogStatus } from "@/features/opportunities/components/CatalogStatus";
import { OpportunityCard } from "@/features/opportunities/components/OpportunityCard";
import { TeaserCard } from "@/features/opportunities/components/TeaserCard";
import { UpsellBlock } from "@/features/opportunities/components/UpsellBlock";
import "@/features/opportunities/i18n/index";
import { PageHead } from "@/components/index";

/** Every qualifying call, then — separately — what the engine ruled out and why. */
export function OpportunitiesPage() {
  const { t } = useTranslation("opportunities");
  const { isLoading, error, gated, teasers, lockedTotal, eligible, blocked, stats } = useOpportunitiesData();

  return (
    <>
      <PageHead title={t("list.title")}>
        {gated ? t("list.gatedSubtitle", { n: stats.total }) : t("list.subtitle")}
      </PageHead>
      <CatalogStatus isLoading={isLoading} error={error} />

      {!isLoading && !error ? (
        gated ? (
          <div className="flex flex-col gap-3">
            {teasers.map((teaser) => (
              <TeaserCard key={teaser.ref} teaser={teaser} />
            ))}
            <UpsellBlock lockedCount={lockedTotal} />
          </div>
        ) : (
          <>
            <h2 className="mb-3 font-display text-lg font-semibold">
              {t("list.relevant")} ({eligible.length})
            </h2>
            <div className="flex flex-col gap-3">
              {eligible.map((item) => (
                <OpportunityCard key={item.id} item={item} />
              ))}
            </div>

            {blocked.length ? (
              <>
                <div className="mb-3 mt-10 flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-semibold">
                    {t("list.blocked")} ({blocked.length})
                  </h2>
                  <span className="text-sm text-muted">{t("list.blockedNote")}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {blocked.map((item) => (
                    <OpportunityCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        )
      ) : null}
    </>
  );
}
