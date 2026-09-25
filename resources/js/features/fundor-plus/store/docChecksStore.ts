import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DocChecksState {
  /** `docKey` → ticked. Only ticked documents are stored. */
  checks: Record<string, true>;
  toggle: (key: string) => void;
}

/**
 * Which required documents the user has ticked off. Client-owned and
 * per-browser by design (Fundor Plus is a demo with no server side), so it
 * lives in Zustand with persistence, under its own key.
 */
export const useDocChecksStore = create<DocChecksState>()(
  persist(
    (set) => ({
      checks: {},
      toggle: (key) =>
        set((state) => {
          const next = { ...state.checks };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { checks: next };
        }),
    }),
    { name: "fundor-rewrite-plus-docs" },
  ),
);
