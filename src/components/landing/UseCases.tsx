import { useState } from 'react';
import { Link } from 'react-router';
import { Building2, Layers, Check, AlertCircle, Sparkles } from 'lucide-react';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Integrated 3-panel pre-screening discovery studio.
 * Combines company profile, statutory revenue band criteria, and real-time eligibility feedback.
 */
export function UseCases({ copy }: { copy: LandingCopy['useCases'] }) {
  const [selectedBand, setSelectedBand] = useState<number>(3);
  const isHu = copy.title.includes('Cégprofilból') || copy.action.includes('előszűrés');

  return (
    <section className="bg-white py-14 sm:py-20 lg:py-24 border-t border-slate-200/80">
      <div className="landing-canvas relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-[#f8fafc] border border-slate-200/90 p-6 sm:p-10 lg:p-14 shadow-sm">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold tracking-widest text-blue-700 uppercase mb-3 inline-block">
            {copy.eyebrow}
          </span>
          <h2 className="text-slate-950 font-bold tracking-tight">{copy.title}</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {isHu
              ? 'Interaktív előszűrési stúdió: határozza meg cégprofilját és jogszabályi árbevételi sávját a valós idejű pályázati alkalmasság megállapításához.'
              : 'Interactive pre-screening studio: define your company profile and statutory revenue band to determine real-time grant suitability.'}
          </p>
        </div>

        {/* Integrated 3-Column Studio Grid */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Panel 1: Company Profile (3 cols / 25%) */}
          <div className="lg:col-span-3">
            <div className="landing-card-elevated h-full rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
                  <Building2 size={14} className="text-blue-600" aria-hidden="true" />
                  <span>01 / {isHu ? 'Vállalkozási profil' : 'Company profile'}</span>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                      {isHu ? 'Cégméret' : 'Company size'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {isHu ? 'KKV (10–49 fő)' : 'SME (10–49 staff)'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                      {isHu ? 'Telephely régió' : 'Location region'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {isHu ? 'Konvergencia régió' : 'Convergence region'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">Dél-Alföld</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                      {isHu ? 'Főtevékenység' : 'Primary activity'}
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-xs mt-0.5 block">
                      TEÁOR 6201
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      {isHu ? 'Egyedi szoftverfejlesztés' : 'Custom software'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                      {isHu ? 'Működési múlt' : 'Operating history'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {isHu ? '2+ lezárt üzleti év' : '2+ closed fiscal years'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>{isHu ? 'NAV-alapadatok megerősítve' : 'Taxpayer data confirmed'}</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Funding Criteria & Statutory Revenue Bands (5 cols / 42%) */}
          <div className="lg:col-span-5">
            <div className="landing-card-elevated h-full rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
                  <Layers size={14} className="text-blue-600" aria-hidden="true" />
                  <span>02 / {isHu ? 'Árbevételi sáv és beruházás' : 'Revenue band & project'}</span>
                </div>

                {/* Investment goal summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
                    <span className="text-slate-500 block text-[11px]">
                      {isHu ? 'Fejlesztési cél:' : 'Investment goal:'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {isHu ? 'Technológiai fejlesztés' : 'Technology investment'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-blue-50/70 border border-blue-200/70 p-3 text-xs">
                    <span className="text-blue-700 block text-[11px] font-semibold">
                      {isHu ? 'Önerő fedezet:' : 'Own contribution:'}
                    </span>
                    <span className="font-bold text-blue-950 mt-0.5 block">
                      {isHu ? '50% önerő igazolva' : '50% confirmed'}
                    </span>
                  </div>
                </div>

                {/* Statutory revenue band selector */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>{copy.bandsTitle}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {isHu ? '2004. évi XXXIV. tv.' : 'Act XXXIV of 2004'}
                    </span>
                  </div>

                  <div className="space-y-1.5" role="radiogroup" aria-label={copy.bandsTitle}>
                    {copy.bands.map((band, idx) => {
                      const bandNum = idx + 1;
                      const isSelected = selectedBand === bandNum;
                      const isLarge = bandNum === 6;

                      return (
                        <button
                          key={band}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedBand(bandNum)}
                          className={`w-full text-left rounded-xl px-3 py-2 text-xs font-medium transition-all flex items-center justify-between border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {bandNum}. {copy.bandLabel}
                            </span>
                            <span className="truncate">{band}</span>
                          </div>
                          {isLarge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-blue-800 text-blue-100' : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {copy.large}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Statutory Threshold Notice */}
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-[11px] sm:text-xs font-medium text-amber-950 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <AlertCircle size={14} className="text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{copy.note}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Real-Time Eligibility Cockpit (4 cols / 33%) */}
          <div className="lg:col-span-4">
            <div className="landing-card-elevated h-full rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/70 via-white to-white p-5 sm:p-6 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider mb-4 pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-1.5 text-blue-700">
                    <Sparkles size={14} aria-hidden="true" />
                    <span>03 / {isHu ? 'Előszűrési eredmény' : 'Screening result'}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                    <span>{isHu ? 'Erős jelölt' : 'Strong candidate'}</span>
                  </span>
                </div>

                {/* Score Showcase */}
                <div className="mt-4 text-center sm:text-left">
                  <div className="text-5xl font-black text-slate-950 tracking-tight">
                    87 <span className="text-xl font-bold text-slate-400">/ 100</span>
                  </div>
                  <div className="mt-1 text-xs font-bold text-blue-700">
                    {isHu ? 'Algoritmikus Fundor Score' : 'Algorithmic Fundor Score'}
                  </div>
                </div>

                {/* Matches & Time stats */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white border border-blue-100 p-3.5 shadow-2xs">
                    <div className="text-2xl font-black text-slate-900">12</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {isHu ? 'Pályázati lehetőség' : 'Matching grants'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-blue-100 p-3.5 shadow-2xs">
                    <div className="text-2xl font-black text-slate-900">
                      {isHu ? '3 perc' : '3 min'}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {isHu ? 'Előszűrési idő' : 'Screening time'}
                    </div>
                  </div>
                </div>

                {/* Category context card */}
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 mb-1">
                    {selectedBand <= 2
                      ? (isHu ? 'Induló és mikrovállalkozási profil' : 'Startup and microenterprise profile')
                      : selectedBand <= 5
                      ? (isHu ? 'Növekedési fázisban lévő KKV profil' : 'Growing SME profile')
                      : (isHu ? 'Nagyvállalati nem-KKV kategória' : 'Large enterprise non-SME category')}
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    {selectedBand <= 2
                      ? copy.cards[0]?.text
                      : copy.cards[1]?.text}
                  </div>
                </div>
              </div>

              {/* Direct CTA */}
              <div className="mt-6 pt-4 border-t border-blue-100">
                <Link
                  to="/assess"
                  className="landing-cta w-full text-center min-h-[52px] text-base font-semibold shadow-md"
                >
                  {copy.action}
                </Link>
                <p className="mt-2 text-center text-[11px] text-slate-500 font-medium">
                  {isHu ? 'Ingyenes előszűrés • Kötelezettségmentes' : 'Free pre-screening • No commitment'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
