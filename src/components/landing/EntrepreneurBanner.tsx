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
      <div className="landing-canvas landing-canvas-photo relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-brand-ink text-brand-cream shadow-2xl min-h-[540px] lg:min-h-[580px] flex items-center">
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
            className="absolute inset-0 flex h-full w-full items-center justify-center p-8 text-center text-sm text-brand-muted-2 bg-brand-ink"
          >
            <span>{copy.imageError}</span>
          </div>
        )}

        {/* Deep Directional Scrim for WCAG AA Contrast */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/90 to-brand-ink/50"
          aria-hidden="true"
        />

        {/* Foreground Content Grid */}
        <div className="relative z-10 w-full p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Panel: Headline & Strategic Direction (60%) */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="inline-flex items-center rounded-full bg-brand-slate border border-brand-muted px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-cream mb-4 sm:mb-5">
                {copy.eyebrow}
              </span>
              <h2 className="!text-brand-cream text-brand-cream text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] max-w-xl">
                {copy.title}
              </h2>
              <p className="mt-5 text-base sm:text-lg text-brand-muted-4 leading-relaxed max-w-xl">
                {copy.text}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/register" className="landing-cta">
                  {copy.registerAction || 'Adószám megadása'}
                </Link>
                <Link to="/assess" className="landing-cta landing-cta-secondary">
                  {copy.action || 'Ingyenes előszűrés'}
                </Link>
              </div>

              {/* Focus Categories */}
              <div className="mt-8 flex flex-wrap gap-2">
                {copy.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center rounded-lg bg-brand-slate/60 border border-brand-muted px-3.5 py-1.5 text-xs font-semibold text-brand-cream backdrop-blur-xs"
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
                  className="rounded-2xl border border-brand-muted bg-brand-slate/90 p-4 sm:p-5 backdrop-blur-md shadow-xl transition-transform hover:translate-x-1"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-brand-muted-3">
                    <span>{ms.label}</span>
                    <span className="font-mono text-brand-orange-soft">0{idx + 1}</span>
                  </div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-brand-cream tracking-tight flex items-center gap-2">
                    {idx === 1 && <span className="h-2.5 w-2.5 rounded-full bg-brand-orange inline-block" aria-hidden="true" />}
                    <span>{ms.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-brand-muted leading-normal">{copy.note}</p>
    </section>
  );
}
