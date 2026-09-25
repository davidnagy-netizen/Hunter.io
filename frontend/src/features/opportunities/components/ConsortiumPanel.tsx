import { useTranslation } from "react-i18next";
import { Panel } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import type { Opportunity } from "@/shared/types/scoring.types";
import "../i18n";

/**
 * A consortium requirement is the biggest practical barrier for a Hungarian
 * SME, so it gets its own panel: what is required, and the company's
 * realistic slice of the grant (an estimate, labelled as one).
 */
export function ConsortiumPanel({ opp }: { opp: Opportunity }) {
  const { t } = useTranslation("opportunities");
  const { huf } = useFormat();
  if (!opp.consortium?.required) return null;
  const share = opp.partnerShare;

  return (
    <Panel
      title={t("detail.consortium.title")}
      subtitle={t("detail.consortium.body", {
        partners: opp.consortium.minPartners,
        countries: opp.consortium.minCountries,
      })}
    >
      {share ? (
        <>
          <dl className="flex flex-col gap-2 rounded-md bg-paper p-4">
            <div className="flex justify-between">
              <dt className="text-sm text-muted">{t("detail.consortium.share")}</dt>
              <dd className="font-display text-lg font-semibold text-green">{huf(share.typicalHuf)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="text-sm text-muted">{t("detail.consortium.range")}</dt>
              <dd className="font-medium">
                {huf(share.minHuf)} – {huf(share.maxHuf)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">{t("detail.consortium.note")}</p>
        </>
      ) : null}
    </Panel>
  );
}
