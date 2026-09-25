import { useTranslation } from "react-i18next";
import { Button, CircularProgress, LockIcon } from "@/shared/components";
import { TeaserCard } from "@/features/opportunities/components/TeaserCard";
import type { CompanyProfile } from "@/shared/types/profile.types";
import { readinessBand, readinessScore } from "../domain/readiness";
import type { AssessmentAnswers } from "../domain/questions";
import type { AssessmentPreview } from "../hooks/useAssessmentPreview";
import { LeadCaptureForm } from "./LeadCaptureForm";
import "../i18n";

const TEASERS_SHOWN = 4;

/**
 * The end of the funnel: the readiness score, how many real calls the
 * visitor qualifies for (the server's count), a few censored matches, and the
 * two ways forward — set up a profile, or ask to be contacted.
 */
export function AssessmentResult({
  answers,
  profile,
  preview,
  previewFailed,
  onContinue,
}: {
  answers: AssessmentAnswers;
  profile: CompanyProfile;
  preview: AssessmentPreview | undefined;
  previewFailed: boolean;
  onContinue: () => void;
}) {
  const { t } = useTranslation("assessment");
  const score = readinessScore({
    employees: profile.employees,
    closed_business_years: profile.closed_business_years,
    goals: profile.goals,
    investment_value: profile.investment_value,
    region: profile.region,
  });
  const band = readinessBand(score);

  return (
    <div className="mx-auto w-full max-w-xl">
      <p className="mb-4 text-center text-xs text-muted">{t("result.label")}</p>
      <div className="flex flex-col items-center gap-3 text-center">
        <CircularProgress value={score} size={150} strokeWidth={11} aria-label={`${t("result.score")}: ${score}`}>
          <span className="font-display text-4xl font-semibold">{score}</span>
          <span className="text-xs text-muted">{t("result.outOf")}</span>
        </CircularProgress>
        <p className="text-sm font-semibold text-gold-deep">
          {t("result.score")} — {t(`result.bands.${band}`)}
        </p>
        {/* If the matches couldn't be loaded we say so, rather than claiming "0 calls". */}
        {preview && !previewFailed ? (
          <>
            <h1 className="font-display text-2xl font-semibold">{t("result.qualify", { count: preview.eligible })}</h1>
            <p className="max-w-md text-sm text-muted">{t("result.explain")}</p>
          </>
        ) : previewFailed ? (
          <p role="alert" className="max-w-md text-sm text-muted">
            {t("result.previewFailed")}
          </p>
        ) : null}
      </div>

      {preview && !previewFailed ? (
        <div className="mt-6 flex flex-col gap-3">
          {preview.teasers.slice(0, TEASERS_SHOWN).map((teaser) => (
            <TeaserCard key={teaser.ref} teaser={teaser} />
          ))}
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <LockIcon /> {t("result.lockHint")}
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <Button variant="gold" block onClick={onContinue}>
          {t("result.cta")}
        </Button>
      </div>
      <div className="mt-6">
        <LeadCaptureForm readiness={score} answers={answers} profile={profile} />
      </div>
    </div>
  );
}
