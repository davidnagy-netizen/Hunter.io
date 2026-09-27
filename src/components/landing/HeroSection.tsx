import { Link } from 'react-router';
import { Check, Clock } from 'lucide-react';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Presents Fundor's grant pre-screening value proposition and illustrative product previews.
 * 12-column institutional layout with structured pre-screening application preview.
 */
export function HeroSection({ copy }: { copy: LandingCopy['hero'] }) {
  return (
    <section className="relative overflow-hidden bg-slate-50/50 py-6 sm:py-10 lg:py-14 border-b border-slate-200/80">
      <div className="landing-canvas relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] border border-blue-100/90 bg-gradient-to-b from-[#f0f6fe] via-[#f7faff] to-[#ffffff] p-6 sm:p-10 lg:p-14 shadow-sm">
        {/* Subtle decorative grid network */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035] text-blue-900"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="48" cy="0" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Editorial Value Narrative */}
          <div className="flex flex-col items-start lg:col-span-6 xl:col-span-7">
            <span className="landing-eyebrow mb-4 sm:mb-5">{copy.eyebrow}</span>
            <h1 className="text-slate-950 font-bold tracking-tight max-w-[650px]">{copy.title}</h1>
            <p className="mt-5 max-w-xl text-lg sm:text-xl text-slate-600 leading-relaxed">{copy.lead}</p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link to="/register" className="landing-cta">
                {copy.primary}
              </Link>
              <Link to="/assess" className="landing-cta landing-cta-secondary">
                {copy.secondary}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-slate-700 font-medium">
              {copy.trustItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check size={16} className="text-blue-700 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span>{copy.microcopy}</span>
              <span aria-hidden="true" className="text-slate-300">•</span>
              <a href={copy.privacyHref} className="landing-link text-sm underline">
                {copy.privacy}
              </a>
            </div>
          </div>

          {/* Right Column: Substantial Financial Intelligence Interface */}
          <div className="lg:col-span-6 xl:col-span-5 relative">
            <div className="mb-2.5 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" aria-hidden="true" />
                {copy.dashboard}
              </span>
              <span>{copy.preview}</span>
            </div>

            <div className="landing-card-elevated relative rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-lg">
              {/* Window Controls & URL bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-1 text-[11px] font-mono font-medium text-slate-500 border border-slate-100">
                  fundor.hu/app/pre-screen
                </div>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/70">
                  {copy.brand}
                </span>
              </div>

              {/* Profile Inputs Mock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="text-slate-500 font-medium">{copy.profileMock.sizeLabel}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{copy.profileMock.sizeValue}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="text-slate-500 font-medium">{copy.profileMock.goalLabel}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{copy.profileMock.goalValue}</div>
                </div>
                <div className="sm:col-span-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="text-slate-500 font-medium">{copy.category}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{copy.grant}</div>
                </div>
              </div>

              {/* Primary Score Evaluation Module */}
              <div className="mt-4 rounded-xl border border-emerald-200/90 bg-emerald-50/80 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">{copy.score}</div>
                    <div className="mt-0.5 text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">{copy.scoreValue}</div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 border border-emerald-300">
                    {copy.statusLabel}
                  </span>
                </div>
                <div className="mt-2 text-xs font-medium text-emerald-800">{copy.scoreNote}</div>
              </div>

              {/* Secondary Readiness Progress */}
              <div className="mt-3.5 rounded-xl border border-slate-200/90 bg-slate-50/90 p-3.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-900 mb-1.5">
                  <span>{copy.readiness}</span>
                  <span className="font-bold text-blue-700">{copy.metrics.readinessScore}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-blue-700 rounded-full transition-all" style={{ width: copy.metrics.readinessScore }} />
                </div>
                <p className="mt-2 leading-relaxed text-slate-600">{copy.readinessNote}</p>
              </div>

              {/* Overlapping Contextual Chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-xs font-semibold text-blue-900 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                  <span>{copy.metrics.matchCount} {copy.metrics.matchLabel}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
                  <Clock size={13} className="text-slate-600 shrink-0" aria-hidden="true" />
                  <span>{copy.metrics.timeEstimate} {copy.metrics.timeLabel}</span>
                </div>
              </div>

              {/* Eligibility Disclosure */}
              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-normal text-slate-500">
                {copy.amount}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Strip seamlessly inside the canvas */}
        <div className="mt-12 sm:mt-16 border-t border-blue-200/60 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-xs font-medium text-slate-500">{copy.sourcesNote}</p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm font-bold tracking-tight text-slate-700">
              {copy.sources.map((src) => (
                <span key={src} className="select-none inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                  {src}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
