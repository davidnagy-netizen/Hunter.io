import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, PageHead, QueryStatus } from "@/shared/components";
import { useCompanyProfile } from "@/shared/hooks/useCompanyProfile";
import { useOpportunitiesData } from "@/features/opportunities/hooks/useOpportunitiesData";
import { DocumentChecklist } from "./DocumentChecklist";
import { DraftPanel } from "./DraftPanel";
import { GrantPicker } from "./GrantPicker";
import "../i18n";

/** Pick a call that fits the company, tick off its documents, generate the demo template. Only for accounts with real access. */
export function PlusWorkspace() {
  const { t } = useTranslation("plus");
  const { profile } = useCompanyProfile();
  const data = useOpportunitiesData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const current = data.eligible.find((r) => r.id === selectedId) ?? data.eligible[0];

  return (
    <>
      <PageHead title={t("title")}>{t("notice")}</PageHead>
      <div className="-mt-4 mb-6">
        <Badge tone="gold">{t("workspace.previewActive")}</Badge>
      </div>

      <QueryStatus isLoading={data.isLoading} error={data.error} />

      {!data.isLoading && !data.error && (!current || !profile) ? (
        <div className="rounded-lg border border-line bg-surface p-6 text-center">
          <b className="text-sm">{t("workspace.emptyTitle")}</b>
          <p className="mt-1 text-sm text-muted">{t("workspace.emptyBody")}</p>
        </div>
      ) : null}

      {current && profile ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-4">
            <GrantPicker options={data.eligible} selectedId={current.id} onSelect={setSelectedId} />
            <DocumentChecklist oppId={current.id} docs={current.docs ?? []} />
          </div>
          <DraftPanel key={current.id} profile={profile} opp={current} />
        </div>
      ) : null}
    </>
  );
}
