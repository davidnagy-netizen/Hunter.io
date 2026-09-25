import { useTranslation } from "react-i18next";

export function RegulatoryDisclaimer() {
  const { i18n } = useTranslation();
  return (
    <aside aria-label={i18n.language.startsWith("en") ? "Regulatory notice" : "Jogi tájékoztató"} className="relative z-50 border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
      {i18n.language.startsWith("en")
        ? "Outputs are informational pre-screenings, not credit recommendations. Loan eligibility and recommendations are unavailable pending the MNB legal opinion."
        : "Az eredmények tájékoztató jellegű előszűrések, nem hitelajánlások. A hiteljogosultság értékelése és a hitelajánlások az MNB jogi állásfoglalásáig nem érhetők el."}
    </aside>
  );
}
