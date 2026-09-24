import { PageHead, Panel } from "@/shared/components";
import { useTranslation } from "react-i18next";
import { useCompanyProfile } from "../hooks/useCompanyProfile";
import "../i18n";
import { ProfileHistoryPanel } from "./ProfileHistoryPanel";
import { ProfileSummary } from "./ProfileSummary";

/**
 * The company's own view of what it told Fundor — every field the onboarding
 * wizard collects, read-only. Editing reuses the wizard itself (`/onboarding`
 * pre-fills from the saved profile, see its own `defaultValues`) rather than
 * a second form that would drift from the first.
 */
export function ProfilePage() {
  const { t } = useTranslation("profile");
  const { profile, isLoading } = useCompanyProfile();

  return (
    <div className="flex flex-col gap-6">
      <PageHead title={t("page.title")}>{t("page.subtitle")}</PageHead>

      {isLoading ? (
        <p className="text-sm text-muted">…</p>
      ) : profile ? (
        <Panel>
          <ProfileSummary profile={profile} />
        </Panel>
      ) : null}

      <ProfileHistoryPanel />
    </div>
  );
}
