import { useTranslation } from "react-i18next";
import { useMetaQuery } from "@/api/meta.queries";
import { ChipButton, SelectField } from "@/components";
import { useLang } from "@/composables/useFormat";
import type { AssessmentAnswers, AssessmentQuestion } from "../domain/questions";

export function AssessmentQuestionBody({
  question,
  answers,
  onChange,
}: {
  question: AssessmentQuestion;
  answers: AssessmentAnswers;
  onChange: (patch: AssessmentAnswers) => void;
}) {
  const { t } = useTranslation(["assessment", "profile"]);
  const lang = useLang();
  const meta = useMetaQuery();
  const reference = meta.data?.reference;

  if (question.kind === "single") {
    return (
      <div className="flex flex-wrap gap-2">
        {question.options.map((option) => (
          <ChipButton
            key={option.key}
            selected={answers[question.id] === option.value}
            onClick={() => onChange({ [question.id]: option.value })}
          >
            {t(`assessment:options.${question.id}.${option.key}`)}
          </ChipButton>
        ))}
      </div>
    );
  }

  if (question.kind === "county") {
    return (
      <SelectField
        label={t("assessment:questions.county")}
        value={answers.county ?? ""}
        onChange={(e) => onChange({ county: e.target.value || undefined })}
      >
        <option value="">{t("assessment:chooseCounty")}</option>
        {reference?.regions.map((r) =>
          r.counties.map((c) => (
            <option key={c} value={c}>
              {c}
              {r.code !== "HU11" ? ` — ${r.name}` : ""}
            </option>
          )),
        )}
      </SelectField>
    );
  }

  if (question.kind === "industry") {
    return (
      <div className="flex flex-wrap gap-2">
        {reference?.industries.map((industry) => (
          <ChipButton
            key={industry.id}
            selected={answers.industryId === industry.id}
            onClick={() => onChange({ industryId: industry.id })}
          >
            {t(`profile:industries.${industry.id}`, {
              defaultValue: industry.label,
            })}
          </ChipButton>
        ))}
      </div>
    );
  }

  const selected = answers.goals ?? [];
  return (
    <div className="flex flex-wrap gap-2">
      {reference?.goals.map((goal) => {
        const on = selected.includes(goal.id);
        return (
          <ChipButton
            key={goal.id}
            selected={on}
            onClick={() =>
              onChange({
                goals: on
                  ? selected.filter((g) => g !== goal.id)
                  : [...selected, goal.id],
              })
            }
          >
            {lang === "en" ? goal.label_en || goal.label : goal.label}
          </ChipButton>
        );
      })}
    </div>
  );
}

