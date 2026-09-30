import { useState } from "react";
import { useTranslation } from "react-i18next";

export function RegulatoryDisclaimer() {
  const { i18n } = useTranslation();
  // Closing hides it for this visit only: nothing is stored, so the notice is back on the next page load.
  const [closed, setClosed] = useState(false);
  const en = i18n.language.startsWith("en");
  if (closed) return null;

  return (
    <aside aria-label={en ? "Regulatory notice" : "Jogi tájékoztató"} className="relative z-50 flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
      <p className="min-w-0 flex-1">
        {en
          ? "Outputs are informational pre-screenings, not credit recommendations. Loan eligibility and recommendations are unavailable pending the MNB legal opinion."
          : "Az eredmények tájékoztató jellegű előszűrések, nem hitelajánlások. A hiteljogosultság értékelése és a hitelajánlások az MNB jogi állásfoglalásáig nem érhetők el."}
      </p>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label={en ? "Close" : "Bezárás"}
        className="-my-1 shrink-0 rounded px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-800"
      >
        <span aria-hidden>×</span>
      </button>
    </aside>
  );
}
