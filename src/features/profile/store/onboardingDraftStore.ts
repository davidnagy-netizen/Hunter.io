import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CompanyProfile } from "../types/profile.types";

interface OnboardingDraftState {
  draft: Partial<CompanyProfile> | null;
  setDraft: (draft: Partial<CompanyProfile>) => void;
  clear: () => void;
}

/**
 * Answers to pre-fill the onboarding wizard with — e.g. from the free
 * assessment. Deliberately **not** the profile: a profile's existence is what
 * `RequireProfile` and every scored screen key off, so parking half-known
 * answers there would skip onboarding and score against invented numbers.
 * The wizard reads this as a starting point and clears it when it saves.
 */
export const useOnboardingDraftStore = create<OnboardingDraftState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      clear: () => set({ draft: null }),
    }),
    { name: "hunter-rewrite-onboarding-draft" },
  ),
);
