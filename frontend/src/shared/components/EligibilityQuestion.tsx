import { useTranslation } from "react-i18next";
import { ChipButton } from "@/shared/components";
import { useEligibilityAnswers } from "../hooks/useEligibilityAnswers";
import type { AnswerMap, EligibilityQuestionDef, QuizOption } from "../types/scoring.types";
import "@/shared/i18n/scoring";

function optionLabel(option: QuizOption, english: boolean) {
  return (english ? option.t_en : option.t_hu) ?? "";
}

/**
 * The inline question shown under a check the server could not decide — the
 * "never guess, ask" half of the eligibility engine. The question itself comes
 * from the server (`questions[]` on the scored call). Answering stores the
 * answer once for the whole company (not per call), and the server re-scores
 * every call that would have asked the same thing.
 */
export function EligibilityQuestion({ oppId, question }: { oppId: string; question: EligibilityQuestionDef }) {
  const { i18n } = useTranslation("scoring");
  const { answers, answerQuestion, isSaving } = useEligibilityAnswers();
  const english = i18n.language === "en";
  const current = answers[question.field];

  return (
    <div className="mt-2 rounded-md bg-paper p-3">
      <p className="text-sm font-medium text-text">{english ? question.q_en : question.q_hu}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {question.opts.map((option) => (
          <ChipButton
            key={String(option.v)}
            selected={option.v !== null && current === option.v}
            disabled={isSaving}
            onClick={() => void answerQuestion(oppId, question.field, option.v as AnswerMap[string] | null)}
          >
            {optionLabel(option, english)}
          </ChipButton>
        ))}
      </div>
    </div>
  );
}
