import { useState } from 'react';
import { Link } from 'react-router';
import heroManufacturing from '@/features/landing/assets/hero-manufacturing.jpg';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Editorial photographic banner showcasing genuine domestic enterprise activity and investment directions.
 * Cinematic canvas blending workshop craftsmanship with financial intelligence and milestone indicators.
 */
export function EntrepreneurBanner({ copy }: { copy: LandingCopy['entrepreneur'] }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-24 border-t border-slate-200/80">
      <div className="landing-canvas relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-slate-950 text-white shadow-2xl min-h-[540px] lg:min-h-[580px] flex items-center">
        {/* Background Workshop Photo with Directional Contrast Gradient */}
        {!imgFailed ? (
          <img
            src={heroManufacturing}
            alt={copy.alt}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
          />
        ) : (
          <div
            role="img"
            aria-label={copy.alt}
            className="absolute inset-0 flex h-full w-full items-center justify-center p-8 text-center text-sm text-slate-400 bg-slate-900"
          >
            <span>{copy.imageError}</span>
          </div>
        )}

        {/* Deep Directional Scrim for WCAG AA Contrast */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40"
          aria-hidden="true"
        />

        {/* Foreground Content Grid */}
        <div className="relative z-10 w-full p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Panel: Headline & Strategic Direction (60%) */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="inline-flex items-center rounded-full bg-blue-500/20 border border-blue-400/40 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-300 mb-4 sm:mb-5">
                {copy.eyebrow}
              </span>
              <h2 className="!text-white text-white text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] max-w-xl">
                {copy.title}
              </h2>
              <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                {copy.text}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/register" className="landing-cta bg-blue-600 hover:bg-blue-500 border-blue-500 text-white font-semibold">
                  {copy.registerAction || 'Adószám megadása'}
                </Link>
                <Link to="/assess" className="landing-cta bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm">
                  {copy.action || 'Ingyenes előszűrés'}
                </Link>
              </div>

              {/* Focus Categories */}
              <div className="mt-8 flex flex-wrap gap-2">
                {copy.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center rounded-lg bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xs"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Panel: Floating Milestone Indicators (40%) */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              {copy.milestones && copy.milestones.map((ms, idx) => (
                <div
                  key={ms.label}
                  className="rounded-2xl border border-white/15 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-md shadow-xl transition-transform hover:translate-x-1"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                    <span>{ms.label}</span>
                    <span className="font-mono text-blue-400">0{idx + 1}</span>
                  </div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    {idx === 1 && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" aria-hidden="true" />}
                    <span>{ms.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500 leading-normal">{copy.note}</p>
    </section>
  );
}
