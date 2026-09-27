import { Binary, ShieldCheck, Scale, Check, AlertCircle } from 'lucide-react';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Details algorithmic scoring criteria, TEÁOR classification, and explicit grant-versus-loan separation.
 * Asymmetric editorial storytelling with interactive product mockups and unpaywalled regulatory disclosures.
 */
export function ValueProposition({
  copy,
  disclaimer,
}: {
  copy: LandingCopy['value'];
  disclaimer: string;
}) {
  const itemScore = copy.items[0];
  const itemTeaor = copy.items[1];
  const itemLoan = copy.items[2];

  const isHu = copy.eyebrow.includes('Értékelési') || copy.title.includes('Ismerje');

  return (
    <section id="rolunk" className="border-t border-slate-200/80 bg-white py-16 sm:py-24 lg:py-28">
      <div className="landing-wrap">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold tracking-widest text-blue-700 uppercase mb-3 inline-block">
            {copy.eyebrow}
          </span>
          <h2 className="text-slate-950 font-bold tracking-tight">{copy.title}</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {isHu
              ? 'Átlátható, jogszabályi alapú ellenőrzési folyamat: algoritmikus alkalmasság, hivatalos ágazati besorolás és szigorúan elkülönített pénzügyi eszközök.'
              : 'A transparent, statutory evaluation process: algorithmic suitability, official sector classification, and strictly separated financial instruments.'}
          </p>
        </div>

        {/* Feature 1: Algorithmic Fundor Score (45% narrative / 55% substantial product visual) */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Narrative (45%) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-4">
              <Binary size={15} aria-hidden="true" />
              <span>01 / {isHu ? 'ALGORITMIKUS ÉRTÉKELÉS' : 'ALGORITHMIC EVALUATION'}</span>
            </div>
            <h3 className="landing-feature-heading text-slate-950 font-bold">
              {itemScore.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {itemScore.text}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 w-full">
              {itemScore.attributes.map((attr) => (
                <div
                  key={attr.label}
                  className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-xs sm:text-sm"
                >
                  <span className="font-semibold text-slate-500">{attr.label}</span>
                  <span className="font-bold text-slate-900">{attr.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isHu
                ? 'Az algoritmus a pénzügyi stabilitást, a célzott tevékenységet és a regionális elhelyezkedést súlyozza a hivatalos pályázati feltételrendszer alapján.'
                : 'The algorithm weights financial stability, target activity and regional location against published grant criteria.'}
            </p>
          </div>

          {/* Right Product Mockup (55%) */}
          <div className="lg:col-span-7">
            <div className="landing-card-elevated rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" aria-hidden="true" />
                  <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                    {isHu ? 'Fundor Score Értékelő Motor' : 'Fundor Score Evaluation Engine'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <Check size={13} className="text-emerald-600" aria-hidden="true" />
                  <span>{isHu ? 'Erős jelölt' : 'Strong candidate'}</span>
                </span>
              </div>

              {/* Large Score Benchmark */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">
                    87 <span className="text-xl sm:text-2xl font-bold text-slate-400">/ 100</span>
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-700">
                    {isHu ? 'Indikatív Fundor Score alkalmasság' : 'Indicative Fundor Score suitability'}
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {isHu ? 'Referencia: GINOP Plusz 1.2.3' : 'Reference: GINOP Plus 1.2.3'}
                </div>
              </div>

              {/* Readiness Secondary Progress */}
              <div className="mt-6 rounded-2xl bg-blue-50/70 border border-blue-100 p-4">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-2">
                  <span>{isHu ? 'Fundor Readiness Score (Adatok teljessége)' : 'Fundor Readiness Score (Data completeness)'}</span>
                  <span className="font-mono">92%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-blue-200/70 overflow-hidden" role="progressbar" aria-valuenow={92} aria-valuemin={0} aria-valuemax={100} aria-label={isHu ? 'Adatok teljessége' : 'Data completeness'}>
                  <div className="h-full rounded-full bg-blue-700" style={{ width: '92%' }} />
                </div>
              </div>

              {/* Criteria Weighting Breakdown */}
              <div className="mt-6 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{isHu ? 'Tevékenységi fókusz (TEÁOR’25 egyezés)' : 'Activity focus (TEÁOR’25 match)'}</span>
                    <span className="font-mono text-slate-600">40% súly • 95% illeszkedés</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: '95%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{isHu ? 'Pénzügyi stabilitás (Lezárt évek és mérleg)' : 'Financial stability (Closed years & balance)'}</span>
                    <span className="font-mono text-slate-600">30% súly • 85% illeszkedés</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{isHu ? 'Régiós prioritás (Telephely konvergencia)' : 'Regional priority (Convergence location)'}</span>
                    <span className="font-mono text-slate-600">30% súly • 80% illeszkedés</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: TEÁOR’25 Sector Classification (55% visual / 45% narrative - REVERSED) */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Product Visual (55%) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="landing-card-elevated rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" aria-hidden="true" />
                  <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                    {isHu ? 'KSH TEÁOR’25 Szűrőmodul' : 'KSH TEÁOR’25 Filter Engine'}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {isHu ? 'KSH Névjegyzék 2025' : 'Official KSH Standard'}
                </span>
              </div>

              {/* Simulation rows */}
              <div className="mt-6 space-y-4">
                {/* Row 1: Valid primary activity */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-mono font-bold text-emerald-900 border border-emerald-200 shrink-0">
                        6201
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {isHu ? 'Egyedi szoftverfejlesztés' : 'Custom software development'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {isHu ? 'Főtevékenységként bejelentve • Kizáró szűrők: tiszta' : 'Primary registered activity • Exclusion filters: clear'}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 self-start sm:self-center">
                      <Check size={13} className="text-emerald-700" aria-hidden="true" />
                      <span>{isHu ? 'Támogatható ágazat' : 'Eligible sector'}</span>
                    </span>
                  </div>
                </div>

                {/* Row 2: Condition-bound activity */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 border border-slate-300 shrink-0">
                        4120
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {isHu ? 'Lakó- és nem lakóépület építése' : 'Construction of residential buildings'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {isHu ? 'Külön felhívási feltételhez kötött korlátozás' : 'Specific programme condition threshold applies'}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 self-start sm:self-center">
                      <AlertCircle size={13} className="text-amber-700" aria-hidden="true" />
                      <span>{isHu ? 'Feltételhez kötött' : 'Conditional'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and conversion badge */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span className="font-medium">
                  {isHu ? 'Automatikus KSH TEÁOR’08 → TEÁOR’25 konverzió' : 'Automatic legacy TEÁOR’08 → TEÁOR’25 mapping'}
                </span>
                <span className="font-mono text-emerald-700 font-bold">
                  {isHu ? 'Hibamentes ágazati megfeleltetés' : 'Verified classification match'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Narrative (45%) */}
          <div className="lg:col-span-5 flex flex-col items-start order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 mb-4">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>02 / {isHu ? 'ÁGAZATI SZŰRÉS' : 'SECTOR FILTERING'}</span>
            </div>
            <h3 className="landing-feature-heading text-slate-950 font-bold">
              {itemTeaor.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {itemTeaor.text}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 w-full">
              {itemTeaor.attributes.map((attr) => (
                <div
                  key={attr.label}
                  className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-xs sm:text-sm"
                >
                  <span className="font-semibold text-slate-500">{attr.label}</span>
                  <span className="font-bold text-slate-900">{attr.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isHu
                ? 'A rendszer a korábbi TEÁOR’08 kódokat automatikusan megfelelteti a hatályos TEÁOR’25 besorolásnak a téves kizárások elkerülése érdekében.'
                : 'The system automatically maps historical TEÁOR’08 codes to active TEÁOR’25 structures to prevent erroneous disqualifications.'}
            </p>
          </div>
        </div>

        {/* Feature 3: Non-Repayable Grant vs. Debt Instrument Separation (id="hitelek" full-width editorial block) */}
        <div id="hitelek" className="mt-16 sm:mt-24 rounded-3xl border border-slate-200/90 bg-slate-50/70 p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100/90 px-3 py-1 text-xs font-bold text-amber-900 mb-4">
              <Scale size={15} aria-hidden="true" />
              <span>03 / {isHu ? 'TŐKE ÉS HITEL ELKÜLÖNÍTÉSE' : 'GRANT AND DEBT SEPARATION'}</span>
            </div>
            <h3 className="landing-feature-heading text-slate-950 font-bold">
              {itemLoan.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {itemLoan.text}
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className="py-3.5 pr-4 font-bold text-slate-500 uppercase tracking-wider w-1/4">
                    {isHu ? 'Szempont' : 'Dimension'}
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-blue-900 bg-blue-50/80 rounded-t-xl w-3/8">
                    {isHu ? 'Vissza nem térítendő támogatás (Grant)' : 'Non-repayable grant'}
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-amber-950 bg-amber-50/80 rounded-t-xl w-3/8">
                    {isHu ? 'Kedvezményes hitelkonstrukció (Loan)' : 'Subsidised loan'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                <tr>
                  <td className="py-3.5 pr-4 font-bold text-slate-900">
                    {isHu ? 'Tőke visszafizetése' : 'Capital repayment'}
                  </td>
                  <td className="py-3.5 px-4 bg-blue-50/40 text-slate-700">
                    {isHu
                      ? 'Nincs visszafizetési kötelezettség a szerződéses célok teljesülésekor.'
                      : 'No repayment required upon fulfilling contractual obligations.'}
                  </td>
                  <td className="py-3.5 px-4 bg-amber-50/40 text-slate-700">
                    {isHu
                      ? 'A teljes tőkeösszeg határidőre visszafizetendő a finanszírozónak.'
                      : 'The full principal amount must be repaid within the term.'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-bold text-slate-900">
                    {isHu ? 'Pénzügyi előny' : 'Financial benefit'}
                  </td>
                  <td className="py-3.5 px-4 bg-blue-50/40 text-slate-700">
                    {isHu
                      ? 'Közvetlen saját tőke növekedés és vissza nem térítendő likviditás.'
                      : 'Direct equity expansion and non-repayable liquidity.'}
                  </td>
                  <td className="py-3.5 px-4 bg-amber-50/40 text-slate-700">
                    {isHu
                      ? 'Kamattámogatás és a piaci tőkeköltség megtakarítása.'
                      : 'Interest subsidy and saved market cost of capital.'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-bold text-slate-900">
                    {isHu ? 'Értékelési logika' : 'Evaluation method'}
                  </td>
                  <td className="py-3.5 px-4 bg-blue-50/40 text-slate-700">
                    {isHu
                      ? 'Algoritmikus pontozás a kiírási feltételek szerint (Fundor Score).'
                      : 'Algorithmic matching against call specifications (Fundor Score).'}
                  </td>
                  <td className="py-3.5 px-4 bg-amber-50/40 text-slate-700">
                    {isHu
                      ? 'Hitelképességi felmérés és tőkeköltség-megtakarítás elemzés.'
                      : 'Credit eligibility and capital cost savings analysis.'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-bold text-slate-900">
                    {isHu ? 'Szabályozási státusz' : 'Regulatory status'}
                  </td>
                  <td className="py-3.5 px-4 bg-blue-50/40 text-slate-700">
                    {isHu
                      ? 'Támogatási katalógusból közvetlenül előszűrhető.'
                      : 'Directly pre-screenable from the public grant directory.'}
                  </td>
                  <td className="py-3.5 px-4 bg-amber-50/40 text-slate-700">
                    {isHu
                      ? 'Tájékoztató jellegű, MNB állásfoglalásig nem minősül hitelajánlásnak.'
                      : 'Informational pre-screening, pending formal MNB legal opinion.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Prominent Unpaywalled Kavosz Gate Box */}
          <div className="mt-8 rounded-2xl border border-amber-300/90 bg-amber-50/90 p-5 sm:p-6 text-xs sm:text-sm font-semibold leading-relaxed text-amber-950">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-bold block mb-1">{isHu ? 'Szabályozási korlátozás:' : 'Regulatory notice:'}</span>
                <span>{copy.gate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Unpaywalled Regulatory Disclaimer Box */}
        <div className="mt-12 sm:mt-16 rounded-3xl border border-slate-200/90 bg-slate-50/80 p-6 sm:p-8 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-700 shrink-0" aria-hidden="true" />
            <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-medium">
              {disclaimer}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
