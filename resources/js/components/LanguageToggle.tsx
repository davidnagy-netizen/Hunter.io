import type { SupportedLanguage } from "@/i18n/i18n";
import { useUiStore } from "@/store/uiStore";

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: "hu", label: "HU" },
  { code: "en", label: "EN" },
];

export function LanguageToggle({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const lang = useUiStore((state) => state.lang);
  const setLang = useUiStore((state) => state.setLang);
  const groupLabel = lang === "hu" ? "Nyelv" : "Language";
  const NAMES: Record<SupportedLanguage, string> = {
    hu: "Magyar",
    en: "English",
  };

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={[
        "inline-flex overflow-hidden rounded-sm border bg-surface",
        dark ? "border-brand-cream/30" : "border-line-strong",
        className,
      ].join(" ")}
    >
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          aria-label={NAMES[code]}
          className={[
            "px-2.5 py-1 text-xs font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
            dark
              ? lang === code
                ? "bg-surface text-ink focus-visible:ring-brand-cream"
                : "bg-transparent text-gray-400 hover:bg-brand-cream/10 focus-visible:ring-brand-cream"
              : lang === code
                ? "bg-ink text-brand-cream focus-visible:ring-gold"
                : "bg-surface text-text-gray-400 hover:bg-paper focus-visible:ring-gold",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
