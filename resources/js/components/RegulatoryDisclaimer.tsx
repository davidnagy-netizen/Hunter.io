import { useState } from "react";
import { useTranslation } from "react-i18next";

export function RegulatoryDisclaimer() {
  const { i18n } = useTranslation();
  const [closed, setClosed] = useState(false);
  const en = i18n.language.startsWith("en");
  if (closed) return null;

  return (
    <aside
      aria-label={en ? "Regulatory notice" : "Jogi tájékoztató"}
      className="relative z-50 flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
    >
      <p className="min-w-0 flex-1">
        {en
          ? "Fundor.hu does not qualify as a credit intermediary or financial advisor supervised by the National Bank of Hungary (MNB). Data, calculations, and the Fundor Score displayed are strictly informational pre-screenings. Credit recommendations and eligibility evaluations remain unavailable pending the formal MNB legal opinion."
          : "A Fundor.hu nem minősül a Magyar Nemzeti Bank (MNB) által felügyelt hitelközvetítőnek vagy pénzügyi tanácsadónak. A felületen megjelenített adatok, számítások és a Fundor Score kizárólag tájékoztató jellegű előszűrésnek minősülnek. A hiteljogosultság értékelése és a hitelajánlások az MNB jogi állásfoglalásáig nem érhetők el."}
      </p>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label={en ? "Close" : "Bezárás"}
        className="-my-1 flex size-8 shrink-0 items-center justify-center rounded border border-slate-300 text-2xl leading-none text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
      >
        <span aria-hidden>×</span>
      </button>
    </aside>
  );
}
