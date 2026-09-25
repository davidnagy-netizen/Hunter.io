import { AssessmentQuestionBody } from "@/features/assessment/components/AssessmentQuestionBody";
import { useCurrentUser } from "@/features/authentication/hooks/useAuth";
import { homePathFor } from "@/features/authentication/lib/homePath";
import "@/features/profile/i18n/index";
import { useOnboardingDraftStore } from "@/features/profile/store/onboardingDraftStore";
import { useMetaQuery } from "@/api/meta.queries";
import {
  Button,
  LanguageToggle,
  Logo,
} from "@/components/index";
import { MatchingLoader } from "@/features/assessment/components/MatchingLoader";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router";
import {
  QUESTIONS,
  buildDraft,
  buildScoringProfile,
  isAnswered,
  type AssessmentAnswers,
} from "@/features/assessment/domain/questions";
import { useAssessmentPreview } from "@/features/assessment/hooks/useAssessmentPreview";
import "@/features/assessment/i18n/index";
import { AssessmentResult } from "@/features/assessment/components/AssessmentResult";

/**
 * The free, no-registration funding assessment: six questions, then a
 * readiness score and a censored preview of the real matches. Everything the
 * visitor answers stays in this component's state until they choose to leave
 * a contact or continue to the full company profile.
 */
export function AssessmentPage() {
  const { t } = useTranslation("assessment");
  const navigate = useNavigate();
  const user = useCurrentUser();
  const meta = useMetaQuery();
  const setDraft = useOnboardingDraftStore((state) => state.setDraft);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [submitted, setSubmitted] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);

  const regions = meta.data?.reference.regions;
  const industries = meta.data?.reference.industries;
  const profile = useMemo(
    () =>
      submitted && regions && industries
        ? buildScoringProfile(answers, { regions, industries })
        : null,
    [submitted, answers, regions, industries],
  );
  const preview = useAssessmentPreview(profile);

  // The funnel is for visitors; someone already signed in has their own matches.
  if (user) return <Navigate to={homePathFor(user)} replace />;

  const question = QUESTIONS[stepIndex];
  const last = stepIndex === QUESTIONS.length - 1;
  const showLoader = submitted && (!animationDone || preview.isPending);

  if (submitted && !showLoader && profile) {
    return (
      <div className="min-h-screen bg-paper p-6">
        <div className="mx-auto mb-6 flex max-w-xl items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              {t("actions.close")}
            </Button>
          </div>
        </div>
        <AssessmentResult
          answers={answers}
          profile={profile}
          preview={preview.data}
          previewFailed={preview.isError}
          onContinue={() => {
            if (regions && industries)
              setDraft(buildDraft(answers, { regions, industries }));
            navigate("/onboarding");
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="mx-auto flex w-full max-w-lg flex-col">
        <div className="mb-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              {t("actions.cancel")}
            </Button>
          </div>
        </div>

        <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-gold transition-[width]"
            style={{
              width: `${Math.round((stepIndex / QUESTIONS.length) * 100)}%`,
            }}
          />
        </div>
        <p className="mb-4 text-xs text-muted">
          {t("progress")} · {stepIndex + 1}/{QUESTIONS.length} · {t("approx")}
        </p>

        <h1 className="font-display text-2xl font-semibold text-ink">
          {t(`questions.${question.id}`)}
        </h1>
        <p className="mb-5 mt-1 text-sm text-muted">{t("sub")}</p>

        <AssessmentQuestionBody
          question={question}
          answers={answers}
          onChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
        />

        <div className="mt-8 flex gap-3">
          {stepIndex > 0 ? (
            <Button variant="ghost" onClick={() => setStepIndex((i) => i - 1)}>
              {t("actions.back")}
            </Button>
          ) : null}
          <Button
            className="flex-1"
            disabled={!isAnswered(question, answers) || (last && !meta.data)}
            onClick={() =>
              last ? setSubmitted(true) : setStepIndex((i) => i + 1)
            }
          >
            {last ? t("actions.result") : t("actions.next")}
          </Button>
        </div>
      </div>

      {showLoader ? (
        <MatchingLoader
          title={t("loader.title")}
          steps={t("loader.steps", { returnObjects: true }) as string[]}
          onAnimationDone={() => setAnimationDone(true)}
        />
      ) : null}
    </div>
  );
}
