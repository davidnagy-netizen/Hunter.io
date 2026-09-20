import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnswerMap } from "../types/scoring.types";

interface LocalAnswersState {
  answers: AnswerMap;
  /** `null` removes the answer (the engine goes back to asking). */
  setAnswer: (key: string, value: AnswerMap[string] | null) => void;
  clear: () => void;
}

/**
 * Eligibility answers for a visitor who isn't signed in — browser-only, same
 * reasoning as `features/profile/store/localProfileStore.ts`. Once signed in,
 * `useEligibilityAnswers` reads the server's copy instead.
 */
export const useLocalAnswersStore = create<LocalAnswersState>()(
  persist(
    (set) => ({
      answers: {},
      setAnswer: (key, value) =>
        set((state) => {
          const next = { ...state.answers };
          if (value === null) delete next[key];
          else next[key] = value;
          return { answers: next };
        }),
      clear: () => set({ answers: {} }),
    }),
    { name: "fundor-rewrite-answers" },
  ),
);
