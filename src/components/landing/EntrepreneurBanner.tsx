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
    <section className="bg-surface py-12 sm:py-16 lg:py-24 border-t border-brand-line">
      <div className="landing-canvas landing-canvas-photo relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-slate-50 text-brand-ink border border-brand-line shadow-sm min-h-[540px] lg:min-h-[580px] flex items-center">
        {!imgFailed ? (
          <img
            src={heroManufacturing}
            alt={copy.alt}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-15 mix-blend-multiply scale-105"
          />
        ) : (
          <div
            role="img"
            aria-label={copy.alt}
            className="absolute inset-0 flex h-full w-full items-center justify-center p-8 text-center text-sm text-brand-slate bg-surface"
          >
            <span>{copy.imageError}</span>
          </div>
        )}

        {/* Deep Directional Scrim for WCAG AA Contrast */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/90 to-slate-50/70"
          aria-hidden="true"
        />

        {/* Foreground Content Grid */}
        <div className="relative z-10 w-full p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Panel: Headline & Strategic Direction (60%) */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="inline-flex items-center rounded-full bg-white border border-brand-line-strong px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-orange-deep mb-4 sm:mb-5">
                {copy.eyebrow}
              </span>
              <h2 className="text-brand-ink text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] max-w-xl">
                {copy.title}
              </h2>
              <p className="mt-5 text-base sm:text-lg text-brand-slate leading-relaxed max-w-xl">
                {copy.text}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/assess" className="landing-cta">
                  {copy.action}
                </Link>
              </div>

              {/* Focus Categories */}
              <div className="mt-8 flex flex-wrap gap-2">
                {copy.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center rounded-lg bg-white border border-brand-line-strong px-3.5 py-1.5 text-xs font-semibold text-brand-ink shadow-2xs"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Panel: Floating Milestone Indicators (40%) */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              {copy.milestones.map((ms) => (
                <div
                  key={ms.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 rounded-2xl border border-brand-line-strong bg-white p-4 sm:p-5 shadow-sm transition-transform hover:translate-x-1"
                >
                  <span className="text-sm font-medium text-brand-slate">{ms.label}:</span>
                  {/* text-lg on phones keeps label and value on one line at 375px. */}
                  <span className="text-lg sm:text-2xl font-bold text-brand-ink tracking-tight">{ms.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
