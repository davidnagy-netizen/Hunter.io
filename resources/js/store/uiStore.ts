import { create } from "zustand";
import { persist } from "zustand/middleware";
import { i18next, type SupportedLanguage, DEFAULT_LANGUAGE } from "@/i18n/i18n";

interface UiState {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
}

/**
 * Client-only UI state that's genuinely cross-feature (today: just the
 * language toggle — the legacy app's workspace switch will join this once
 * the `admin` feature exists). Deliberately not React Query: this isn't
 * server data.
 *
 * Persisted under its own key, distinct from the legacy app's `hunter_state`
 * localStorage blob, so the two frontends never read or clobber each
 * other's storage while both exist during the migration.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      lang: DEFAULT_LANGUAGE,
      setLang: (lang) => {
        void i18next.changeLanguage(lang);
        set({ lang });
      },
    }),
    { name: "fundor-rewrite-ui" },
  ),
);
