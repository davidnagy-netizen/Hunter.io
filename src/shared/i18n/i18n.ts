import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import huErrors from "./locales/hu/errors.json";
import enErrors from "./locales/en/errors.json";

export type SupportedLanguage = "hu" | "en";
export const DEFAULT_LANGUAGE: SupportedLanguage = "hu";

/**
 * Read synchronously so i18next initializes with the right language before
 * the first render — avoids a flash of Hungarian before `uiStore` rehydrates.
 * Kept independent of `shared/store/uiStore` (no import of it here) so this
 * module has no feature/store dependency of its own; `uiStore` is the one
 * that calls back into `i18n.changeLanguage()` on future changes.
 */
function readPersistedLanguage(): SupportedLanguage {
  try {
    const raw = localStorage.getItem("hunter-rewrite-ui");
    if (!raw) return DEFAULT_LANGUAGE;
    const parsed = JSON.parse(raw);
    const lang = parsed?.state?.lang;
    return lang === "en" ? "en" : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

void i18next.use(initReactI18next).init({
  lng: readPersistedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  ns: ["errors"],
  defaultNS: "errors",
  resources: {
    hu: { errors: huErrors },
    en: { errors: enErrors },
  },
  interpolation: {
    // React already escapes interpolated values.
    escapeValue: false,
  },
  returnNull: false,
});

/**
 * Lets a feature register its own translation namespace without `shared/`
 * importing from `features/` (which would invert the dependency direction).
 * A feature calls this once, as a side effect of importing its own
 * `i18n/index.ts` from its entry component.
 */
export function registerFeatureTranslations(
  namespace: string,
  resources: Record<SupportedLanguage, Record<string, unknown>>,
) {
  for (const [lang, bundle] of Object.entries(resources)) {
    i18next.addResourceBundle(lang, namespace, bundle, true, false);
  }
}

export { i18next };
