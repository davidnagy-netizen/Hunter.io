import { useTranslation } from "react-i18next";
import { ChipButton } from "@/shared/components";
import { useEligibilityAnswers } from "../hooks/useEligibilityAnswers";
import type { AnswerMap, QuizOption, Rule } from "../types/scoring.types";
import "../i18n";

function optionLabel(option: QuizOption, english: boolean) {
  return (english ? option.t_en || option.t : option.t_hu || option.t) ?? "";
}

/**
 * The inline question shown under a rule whose field is still unknown — the
 * "never guess, ask" half of the eligibility engine. Answering stores the
 * answer once for the whole company (not per call), so every call that would
 * have asked the same thing recalculates immediately.
 *
 * Renders nothing for a rule without a `quiz` (those can only be resolved by
 * editing the company profile).
 */
export function EligibilityQuestion({ oppId, rule }: { oppId: string; rule: Rule }) {
  const { i18n } = useTranslation("scoring");
  const { answers, answerQuestion, isSaving } = useEligibilityAnswers();
  const quiz = rule.quiz;
  if (!quiz) return null;

  const english = i18n.language === "en";
  const question = (english ? quiz.q_en || quiz.q : quiz.q_hu || quiz.q) ?? "";
  const current = answers[rule.field];

  return (
    <div className="mt-2 rounded-md bg-paper p-3">
      <p className="text-sm font-medium text-text">{question}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {quiz.opts.map((option) => (
          <ChipButton
            key={String(option.v)}
            selected={option.v !== null && current === option.v}
            disabled={isSaving}
            onClick={() => void answerQuestion(oppId, rule.field, option.v as AnswerMap[string] | null)}
          >
            {optionLabel(option, english)}
          </ChipButton>
        ))}
      </div>
    </div>
  );
}
