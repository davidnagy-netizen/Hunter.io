import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocalSavedState {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

/** Saved opportunities for a visitor who isn't signed in — browser-only, like the local profile and answers. */
export const useLocalSavedStore = create<LocalSavedState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })),
      clear: () => set({ ids: [] }),
    }),
    { name: "hunter-rewrite-saved" },
  ),
);
