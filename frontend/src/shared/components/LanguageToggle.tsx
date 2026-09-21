import { useUiStore } from "@/shared/store/uiStore";
import type { SupportedLanguage } from "@/shared/i18n/i18n";

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: "hu", label: "HU" },
  { code: "en", label: "EN" },
];

export function LanguageToggle({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const lang = useUiStore((state) => state.lang);
  const setLang = useUiStore((state) => state.setLang);

  return (
    <div className={["inline-flex overflow-hidden rounded-md border", dark ? "border-white/30" : "border-line-strong", className].join(" ")}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={[
            "px-2.5 py-1 text-xs font-medium transition-colors",
            dark
              ? lang === code ? "bg-white text-ink" : "bg-transparent text-white/70 hover:bg-white/10"
              : lang === code ? "bg-ink text-white" : "bg-white text-muted hover:bg-paper",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
