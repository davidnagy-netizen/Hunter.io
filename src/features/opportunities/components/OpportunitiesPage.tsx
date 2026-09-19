import { useTranslation } from "react-i18next";
import { useOpportunitiesData } from "../hooks/useOpportunitiesData";
import { CatalogStatus } from "./CatalogStatus";
import { OpportunityCard } from "./OpportunityCard";
import { PageHead } from "./PageHead";
import { TeaserCard } from "./TeaserCard";
import { UpsellBlock } from "./UpsellBlock";
import "../i18n";

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
                <OpportunityCard key={item.opp.id} item={item} />
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
                    <OpportunityCard key={item.opp.id} item={item} />
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
