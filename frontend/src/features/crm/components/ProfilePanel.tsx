import { useTranslation } from "react-i18next";
import { Panel } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { useGoalLabel } from "@/shared/hooks/useGoalLabel";
import type { CompanyProfile } from "@/shared/types/profile.types";
import "../i18n";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

/** The company's own funding profile — the most useful thing to have in front of you on a call. Empty is itself a finding. */
export function ProfilePanel({ profile, profileVersions, readiness }: { profile: Partial<CompanyProfile> | null; profileVersions: number; readiness?: number | null }) {
  const { t } = useTranslation("crm");
  const { huf } = useFormat();
  const goalLabel = useGoalLabel();

  return (
    <Panel title={t("profile.title")}>
      {profile ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {profile.employees != null ? <Fact label={t("profile.employees")}>{profile.employees}</Fact> : null}
            {profile.county ? <Fact label={t("profile.county")}>{profile.county}</Fact> : null}
            {profile.teaor ? <Fact label={t("profile.teaor")}>{String(profile.teaor)}</Fact> : null}
            {profile.investment_value != null ? <Fact label={t("profile.projectValue")}>{huf(profile.investment_value)}</Fact> : null}
            {profile.revBand ? <Fact label={t("profile.revenue")}>{profile.revBand}</Fact> : null}
            {profileVersions ? <Fact label={t("profile.versions")}>{profileVersions}</Fact> : null}
          </div>
          {profile.goals?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.goals.map((id) => (
                <span key={id} className="rounded bg-slate-bg px-2 py-0.5 text-xs text-slate">
                  {goalLabel(id)}
                </span>
              ))}
            </div>
          ) : null}
          {profile.projectName ? <p className="mt-3 text-sm text-muted">{profile.projectName}</p> : null}
        </>
      ) : (
        <p className="text-sm text-muted">{t("profile.empty")}</p>
      )}
      {readiness != null ? (
        <div className="mt-3 flex justify-between border-t border-line pt-2 text-sm">
          <span className="text-muted">{t("profile.readiness")}</span>
          <b>{readiness} / 100</b>
        </div>
      ) : null}
    </Panel>
  );
}
