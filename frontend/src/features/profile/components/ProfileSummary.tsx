import { useTranslation } from "react-i18next";
import { useMetaQuery } from "@/shared/api/meta.queries";
import { useFormat } from "@/shared/hooks/useFormat";
import { useGoalLabel } from "@/shared/hooks/useGoalLabel";
import type { CompanyProfile } from "../types/profile.types";
import "../i18n";

const CLOSED_YEARS_KEY: Record<number, string> = { 0: "none", 1: "one" };

/** A row's value, or nothing at all — an optional field the profile never set shouldn't render as "—". */
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-line py-2.5 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-text">{value}</dd>
    </div>
  );
}

/**
 * A company profile's fields, read-only, formatted the way a person reads
 * them rather than the ids/keys the server stores — the same lookups
 * `OnboardingWizard` uses to render its own chips, reused here since this is
 * the same data, just after the fact. Shared by the signed-in company's own
 * `/app/profile` and the admin's per-account history page, so an id-to-label
 * mismatch only ever needs fixing once.
 */
export function ProfileSummary({ profile }: { profile: CompanyProfile }) {
  const { t, i18n } = useTranslation("profile");
  const isEnglish = i18n.language === "en";
  const { huf } = useFormat();
  const goalLabel = useGoalLabel();
  const meta = useMetaQuery();

  const regions = meta.data?.reference.regions ?? [];
  const industries = meta.data?.reference.industries ?? [];
  const orgTypes = meta.data?.reference.orgTypes ?? [];

  const region = regions.find((r) => r.counties.includes(profile.county));
  const industry = industries.find((ind) => ind.id === profile.industryId);
  const orgType = orgTypes.find((o) => o.id === profile.orgType);
  const closedYearsKey = CLOSED_YEARS_KEY[profile.closed_business_years] ?? "twoOrMore";

  return (
    <dl>
      <Row label={t("fields.company")} value={profile.company} />
      <Row label={t("fields.taxNumber")} value={profile.taxNumber} />
      <Row label={t("fields.employees")} value={String(profile.employees)} />
      <Row label={t("fields.county")} value={region ? `${profile.county} — ${region.name}` : profile.county} />
      <Row label={t("fields.closedYears")} value={t(`closedYearsOptions.${closedYearsKey}`)} />
      <Row label={t("fields.revBand")} value={profile.revBand} />
      <Row
        label={t("fields.industry")}
        value={t(`industries.${profile.industryId}`, { defaultValue: industry?.label ?? profile.industryId })}
      />
      <Row label={t("fields.goals")} value={profile.goals.map(goalLabel).join(", ")} />
      <Row label={t("fields.projectName")} value={profile.projectName} />
      <Row label={t("fields.investmentValue")} value={profile.investment_value ? huf(profile.investment_value) : null} />
      <Row
        label={t("fields.fundingPref")}
        value={profile.funding_pref.map((key) => t(`fundingPrefOptions.${key}`, { defaultValue: key })).join(", ")}
      />
      <Row label={t("fields.orgType")} value={orgType ? (isEnglish ? orgType.label_en : orgType.label_hu) : profile.orgType} />
      <Row
        label={t("fields.consortiumReady")}
        value={profile.consortium_ready === undefined ? null : profile.consortium_ready ? t("haveOrCanBuildPartners") : t("onlyAlone")}
      />
      <Row label={t("fields.euExperience")} value={profile.eu_experience === undefined ? null : profile.eu_experience ? t("yes") : t("notYet")} />
    </dl>
  );
}
