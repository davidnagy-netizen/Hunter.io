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
    <section className="bg-[#FFFFFF] py-14 sm:py-20 lg:py-24 border-t border-[#E6E4DF]">
      <div className="landing-canvas landing-canvas-blueprint relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-[#F7F6F4] border border-[#E6E4DF] p-6 sm:p-10 lg:p-14 shadow-sm">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold tracking-widest text-[#273F4F] uppercase mb-3 inline-block">
            {copy.eyebrow}
          </span>
          <h2 className="text-[#161616] font-bold tracking-tight">{copy.title}</h2>
          <p className="mt-4 text-base sm:text-lg text-[#273F4F] leading-relaxed">
            {isHu
              ? 'Interaktív előszűrési stúdió: határozza meg cégprofilját és jogszabályi árbevételi sávját a valós idejű pályázati alkalmasság megállapításához.'
              : 'Interactive pre-screening studio: define your company profile and statutory revenue band to determine real-time grant suitability.'}
          </p>
        </div>

        {/* Integrated 3-Column Studio Grid */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Panel 1: Company Profile (3 cols / 25%) */}
          <div className="lg:col-span-3">
            <div className="landing-card-elevated h-full rounded-3xl border border-[#D9D8D5] bg-[#FFFFFF] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#687984] uppercase tracking-wider mb-4 pb-3 border-b border-[#E6E4DF]">
                  <Building2 size={14} className="text-[#273F4F]" aria-hidden="true" />
                  <span>01 / {isHu ? 'Vállalkozási profil' : 'Company profile'}</span>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="rounded-xl bg-[#FAFAF9] border border-[#E6E4DF] p-3">
                    <span className="text-[11px] font-semibold text-[#687984] block uppercase tracking-wider">
                      {isHu ? 'Cégméret' : 'Company size'}
                    </span>
                    <span className="font-bold text-[#161616] mt-0.5 block">
                      {isHu ? 'KKV (10–49 fő)' : 'SME (10–49 staff)'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#FAFAF9] border border-[#E6E4DF] p-3">
                    <span className="text-[11px] font-semibold text-[#687984] block uppercase tracking-wider">
                      {isHu ? 'Telephely régió' : 'Location region'}
                    </span>
                    <span className="font-bold text-[#161616] mt-0.5 block">
                      {isHu ? 'Konvergencia régió' : 'Convergence region'}
                    </span>
                    <span className="text-[11px] text-[#687984] block">Dél-Alföld</span>
                  </div>

                  <div className="rounded-xl bg-[#FAFAF9] border border-[#E6E4DF] p-3">
                    <span className="text-[11px] font-semibold text-[#687984] block uppercase tracking-wider">
                      {isHu ? 'Főtevékenység' : 'Primary activity'}
                    </span>
                    <span className="font-mono font-bold text-[#273F4F] text-xs mt-0.5 block">
                      TEÁOR 6201
                    </span>
                    <span className="text-[11px] text-[#273F4F] block">
                      {isHu ? 'Egyedi szoftverfejlesztés' : 'Custom software'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#FAFAF9] border border-[#E6E4DF] p-3">
                    <span className="text-[11px] font-semibold text-[#687984] block uppercase tracking-wider">
                      {isHu ? 'Működési múlt' : 'Operating history'}
                    </span>
                    <span className="font-bold text-[#161616] mt-0.5 block">
                      {isHu ? '2+ lezárt üzleti év' : '2+ closed fiscal years'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E6E4DF] text-xs font-semibold text-[#273F4F] flex items-center gap-1.5">
                <Check size={14} className="text-[#FE7743] shrink-0" aria-hidden="true" />
                <span>{isHu ? 'NAV-alapadatok megerősítve' : 'Taxpayer data confirmed'}</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Funding Criteria & Statutory Revenue Bands (5 cols / 42%) */}
          <div className="lg:col-span-5">
            <div className="landing-card-elevated h-full rounded-3xl border border-[#D9D8D5] bg-[#FFFFFF] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#687984] uppercase tracking-wider mb-4 pb-3 border-b border-[#E6E4DF]">
                  <Layers size={14} className="text-[#273F4F]" aria-hidden="true" />
                  <span>02 / {isHu ? 'Árbevételi sáv és beruházás' : 'Revenue band & project'}</span>
                </div>

                {/* Investment goal summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  <div className="rounded-xl bg-[#FAFAF9] border border-[#E6E4DF] p-3 text-xs">
                    <span className="text-[#687984] block text-[11px]">
                      {isHu ? 'Fejlesztési cél:' : 'Investment goal:'}
                    </span>
                    <span className="font-bold text-[#161616] mt-0.5 block">
                      {isHu ? 'Technológiai fejlesztés' : 'Technology investment'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#FFF1EC] border border-[#FE7743] p-3 text-xs">
                    <span className="text-[#273F4F] block text-[11px] font-semibold">
                      {isHu ? 'Önerő fedezet:' : 'Own contribution:'}
                    </span>
                    <span className="font-bold text-[#161616] mt-0.5 block">
                      {isHu ? '50% önerő igazolva' : '50% confirmed'}
                    </span>
                  </div>
                </div>

                {/* Statutory revenue band selector */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#273F4F] mb-2">
                    <span>{copy.bandsTitle}</span>
                    <span className="text-[11px] font-mono text-[#687984]">
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
                              ? 'bg-[#FFF1EC] text-[#161616] border-[#FE7743] shadow-xs'
                              : 'bg-[#FAFAF9] hover:bg-[#F7F6F4] text-[#273F4F] border-[#E6E4DF]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-[#273F4F] text-[#EFEEEA]' : 'bg-[#E6E4DF] text-[#273F4F]'
                              }`}
                            >
                              {bandNum}. {copy.bandLabel}
                            </span>
                            <span className="truncate">{band}</span>
                          </div>
                          {isLarge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-[#273F4F] text-[#EFEEEA]' : 'bg-[#E6E4DF] text-[#273F4F]'
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
              <div className="mt-4 rounded-xl border border-[#D9D8D5] bg-[#F7F6F4] p-3 text-[11px] sm:text-xs font-medium text-[#273F4F] leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <AlertCircle size={14} className="text-[#273F4F] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{copy.note}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Real-Time Eligibility Cockpit (4 cols / 33%) */}
          <div className="lg:col-span-4">
            <div className="landing-card-elevated h-full rounded-3xl border border-[#202F38] bg-[#273F4F] text-[#EFEEEA] p-5 sm:p-6 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider mb-4 pb-3 border-b border-[#202F38]">
                  <div className="flex items-center gap-1.5 text-[#FEA07B]">
                    <Sparkles size={14} aria-hidden="true" />
                    <span>03 / {isHu ? 'Előszűrési eredmény' : 'Screening result'}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#202F38] px-2.5 py-0.5 text-xs font-bold text-[#EFEEEA] border border-[#687984]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FE7743]" aria-hidden="true" />
                    <span>{isHu ? 'Erős jelölt' : 'Strong candidate'}</span>
                  </span>
                </div>

                {/* Score Showcase */}
                <div className="mt-4 text-center sm:text-left">
                  <div className="text-5xl font-black text-[#FE7743] tracking-tight">
                    87 <span className="text-xl font-bold text-[#BEC5CA]">/ 100</span>
                  </div>
                  <div className="mt-1 text-xs font-bold text-[#D4D9DC]">
                    {isHu ? 'Algoritmikus Fundor Score' : 'Algorithmic Fundor Score'}
                  </div>
                </div>

                {/* Matches & Time stats */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#202F38] border border-[#687984] p-3.5 shadow-2xs">
                    <div className="text-2xl font-black text-[#EFEEEA]">12</div>
                    <div className="text-[11px] font-semibold text-[#BEC5CA] mt-0.5">
                      {isHu ? 'Pályázati lehetőség' : 'Matching grants'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#202F38] border border-[#687984] p-3.5 shadow-2xs">
                    <div className="text-2xl font-black text-[#EFEEEA]">
                      {isHu ? '3 perc' : '3 min'}
                    </div>
                    <div className="text-[11px] font-semibold text-[#BEC5CA] mt-0.5">
                      {isHu ? 'Előszűrési idő' : 'Screening time'}
                    </div>
                  </div>
                </div>

                {/* Category context card */}
                <div className="mt-4 rounded-xl bg-[#202F38] border border-[#687984] p-3 text-xs text-[#D4D9DC]">
                  <div className="font-bold text-[#EFEEEA] mb-1">
                    {selectedBand <= 2
                      ? (isHu ? 'Induló és mikrovállalkozási profil' : 'Startup and microenterprise profile')
                      : selectedBand <= 5
                      ? (isHu ? 'Növekedési fázisban lévő KKV profil' : 'Growing SME profile')
                      : (isHu ? 'Nagyvállalati nem-KKV kategória' : 'Large enterprise non-SME category')}
                  </div>
                  <div className="text-[11px] leading-relaxed text-[#BEC5CA]">
                    {selectedBand <= 2
                      ? copy.cards[0]?.text
                      : copy.cards[1]?.text}
                  </div>
                </div>
              </div>

              {/* Direct CTA */}
              <div className="mt-6 pt-4 border-t border-[#202F38]">
                <Link
                  to="/assess"
                  className="landing-cta w-full text-center min-h-[52px] text-base font-semibold shadow-md"
                >
                  {copy.action}
                </Link>
                <p className="mt-2 text-center text-[11px] text-[#BEC5CA] font-medium">
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
