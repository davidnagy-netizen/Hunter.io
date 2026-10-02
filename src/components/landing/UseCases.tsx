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
  const { profile, project, result } = copy;

  return (
    <section className="bg-surface py-14 sm:py-20 lg:py-24 border-t border-brand-line">
      <div className="landing-canvas landing-canvas-blueprint relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-brand-surface-muted border border-brand-line p-6 sm:p-10 lg:p-14 shadow-sm">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold tracking-widest text-brand-slate uppercase mb-3 inline-block">
            {copy.eyebrow}
          </span>
          <h2 className="text-brand-ink font-bold tracking-tight">{copy.title}</h2>
          <p className="mt-4 text-base sm:text-lg text-brand-slate leading-relaxed">
            {copy.intro}
          </p>
        </div>

        {/* Integrated 3-Column Studio Grid */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Panel 1: Company Profile (3 cols / 25%) */}
          <div className="lg:col-span-3">
            <div className="landing-card-elevated h-full rounded-3xl border border-brand-line-strong bg-surface p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-muted uppercase tracking-wider mb-4 pb-3 border-b border-brand-line">
                  <Building2 size={14} className="text-brand-slate" aria-hidden="true" />
                  <span>{profile.title}</span>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="rounded-xl bg-brand-paper border border-brand-line p-3">
                    <span className="text-[11px] font-semibold text-brand-muted block">
                      {profile.size}
                    </span>
                    <span className="font-bold text-brand-ink mt-0.5 block">
                      {profile.sizeValue}
                    </span>
                  </div>

                  <div className="rounded-xl bg-brand-paper border border-brand-line p-3">
                    <span className="text-[11px] font-semibold text-brand-muted block">
                      {profile.site}
                    </span>
                    <span className="font-bold text-brand-ink mt-0.5 block">
                      {profile.siteValue}
                    </span>
                    <span className="text-[11px] text-brand-muted block">{profile.siteSub}</span>
                  </div>

                  <div className="rounded-xl bg-brand-paper border border-brand-line p-3">
                    <span className="text-[11px] font-semibold text-brand-muted block">
                      {profile.activity}
                    </span>
                    <span className="font-mono font-bold text-brand-slate text-xs mt-0.5 block">
                      {profile.activityValue}
                    </span>
                    <span className="text-[11px] text-brand-slate block">
                      {profile.activitySub}
                    </span>
                  </div>

                  <div className="rounded-xl bg-brand-paper border border-brand-line p-3">
                    <span className="text-[11px] font-semibold text-brand-muted block">
                      {profile.history}
                    </span>
                    <span className="font-bold text-brand-ink mt-0.5 block">
                      {profile.historyValue}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-line text-xs font-semibold text-brand-slate flex items-center gap-1.5">
                <Check size={14} className="text-brand-orange shrink-0" aria-hidden="true" />
                <span>{profile.confirmed}</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Funding Criteria & Statutory Revenue Bands (5 cols / 42%) */}
          <div className="lg:col-span-5">
            <div className="landing-card-elevated h-full rounded-3xl border border-brand-line-strong bg-surface p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-muted uppercase tracking-wider mb-4 pb-3 border-b border-brand-line">
                  <Layers size={14} className="text-brand-slate" aria-hidden="true" />
                  <span>{project.title}</span>
                </div>

                {/* Investment goal summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  <div className="rounded-xl bg-brand-paper border border-brand-line p-3 text-xs">
                    <span className="text-brand-muted block text-[11px]">
                      {project.goal}
                    </span>
                    <span className="font-bold text-brand-ink mt-0.5 block">
                      {project.goalValue}
                    </span>
                  </div>
                  <div className="rounded-xl bg-brand-orange-bg border border-brand-orange p-3 text-xs">
                    <span className="text-brand-slate block text-[11px] font-semibold">
                      {project.own}
                    </span>
                    <span className="font-bold text-brand-ink mt-0.5 block">
                      {project.ownValue}
                    </span>
                  </div>
                </div>

                {/* Statutory revenue band selector */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-brand-slate mb-2">
                    <span title={copy.bandsHint}>{copy.bandsTitle}</span>
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
                              ? 'bg-brand-orange-bg text-brand-ink border-brand-orange shadow-xs'
                              : 'bg-brand-paper hover:bg-brand-surface-muted text-brand-slate border-brand-line'
                          }`}
                        >
                          {/* The band labels wrap rather than truncate: "20 milliárd Ft felett" must stay readable on phones. */}
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`shrink-0 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-brand-slate text-brand-cream' : 'bg-brand-line text-brand-slate'
                              }`}
                            >
                              {bandNum}. {copy.bandLabel}
                            </span>
                            <span>{band}</span>
                          </div>
                          {isLarge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-brand-slate text-brand-cream' : 'bg-brand-line text-brand-slate'
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
              <div className="mt-4 rounded-xl border border-brand-line-strong bg-brand-surface-muted p-3 text-[11px] sm:text-xs font-medium text-brand-slate leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <AlertCircle size={14} className="text-brand-slate shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{copy.note}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Real-Time Eligibility Cockpit (4 cols / 33%) */}
          <div className="lg:col-span-4">
            <div className="landing-card-elevated h-full rounded-3xl border border-brand-line-strong bg-slate-50 text-brand-ink p-5 sm:p-6 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider mb-4 pb-3 border-b border-brand-line">
                  <div className="flex items-center gap-1.5 text-brand-orange-deep">
                    <Sparkles size={14} aria-hidden="true" />
                    <span>{result.title}</span>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-brand-ink border border-brand-line-strong">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" aria-hidden="true" />
                    <span>{result.badge}</span>
                  </span>
                </div>

                {/* Score Showcase */}
                <div className="mt-4 text-center sm:text-left">
                  <div className="text-5xl font-black text-brand-orange-deep tracking-tight">
                    87 <span className="text-xl font-bold text-brand-slate">/ 100</span>
                  </div>
                  <div className="mt-1 text-xs font-bold text-brand-slate">
                    {result.score}
                  </div>
                </div>

                {/* Matches & Time stats */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white border border-brand-line-strong p-3.5 shadow-2xs">
                    <div className="text-2xl font-black text-brand-ink">{result.matchCount}</div>
                    <div className="text-[11px] font-semibold text-brand-slate mt-0.5">
                      {result.matchLabel}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-brand-line-strong p-3.5 shadow-2xs">
                    <div className="text-2xl font-black text-brand-ink">
                      {result.time}
                    </div>
                    <div className="text-[11px] font-semibold text-brand-slate mt-0.5">
                      {result.timeLabel}
                    </div>
                  </div>
                </div>

                {/* Category context card */}
                <div className="mt-4 rounded-xl bg-white border border-brand-line-strong p-3 text-xs text-brand-slate">
                  <div className="font-bold text-brand-ink mb-1">
                    {selectedBand <= 2 ? result.micro : selectedBand <= 5 ? result.growing : result.large}
                  </div>
                  <div className="text-[11px] leading-relaxed text-brand-slate">
                    {selectedBand <= 2
                      ? copy.cards[0]?.text
                      : copy.cards[1]?.text}
                  </div>
                </div>
              </div>

              {/* Direct CTA */}
              <div className="mt-6 pt-4 border-t border-brand-line">
                <Link
                  to="/assess"
                  className="landing-cta w-full text-center min-h-[52px] text-base font-semibold shadow-md"
                >
                  {copy.action}
                </Link>
                <p className="mt-2 text-center text-[11px] text-brand-slate font-medium">
                  {result.trust}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
