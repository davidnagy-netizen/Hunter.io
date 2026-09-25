import { useTranslation } from "react-i18next";
import { Panel, PageHead } from "@/components/index";
import { useOpportunitiesData } from "@/features/opportunities/hooks/useOpportunitiesData";
import { useSaved } from "@/features/opportunities/hooks/useSaved";
import { CatalogStatus } from "@/features/opportunities/components/CatalogStatus";
import { OpportunityCard } from "@/features/opportunities/components/OpportunityCard";
import "@/features/opportunities/i18n/index";

/**
 * The calls the user chose to keep. Shows everything they saved, including a
 * call the engine has since ruled out — hiding it would make a saved call
 * silently vanish.
 */
export function SavedPage() {
  const { t } = useTranslation("opportunities");
  const { isLoading, error, gated, ranked } = useOpportunitiesData();
  const saved = useSaved();
  const items = ranked.filter((r) => saved.ids.includes(r.id));

  return (
    <>
      <PageHead title={t("saved.title")}>{t("saved.subtitle")}</PageHead>
      <CatalogStatus isLoading={isLoading} error={error} />

      {!isLoading && !error ? (
        gated ? (
          <Panel>
            <p className="text-sm text-muted">{t("saved.gated")}</p>
          </Panel>
        ) : items.length ? (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Panel title={t("saved.emptyTitle")}>
            <p className="text-sm text-muted">{t("saved.emptyBody")}</p>
          </Panel>
        )
      ) : null}
    </>
  );
}
