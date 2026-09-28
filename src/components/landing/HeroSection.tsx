import { Check } from "lucide-react";
import { Link } from "react-router";
import type { LandingCopy } from "../../data/landingContent";
import { GsapReveal } from "./GsapReveal";
import { HeroVisual } from "./HeroVisual";

/**
 * Presents Fundor's grant pre-screening value proposition and illustrative product previews.
 * 12-column institutional layout with structured pre-screening application preview.
 */
export function HeroSection({ copy }: { copy: LandingCopy["hero"] }) {
  return (
    <section className="relative overflow-hidden bg-surface py-6 sm:py-10 lg:py-14 border-b border-brand-line">
      <div className="landing-canvas landing-canvas-hero relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] border border-brand-line-strong bg-brand-cream p-6 sm:p-10 lg:p-14 shadow-sm">
        {/* Subtle decorative grid network */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04] text-brand-slate"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="hero-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle cx="48" cy="0" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <GsapReveal
            stagger={0.12}
            className="flex flex-col items-start lg:col-span-6 xl:col-span-7"
          >
            <span className="landing-eyebrow mb-4 sm:mb-5">{copy.eyebrow}</span>
            <h1 className="text-brand-ink font-bold tracking-tight max-w-[650px]">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg sm:text-xl text-brand-slate leading-relaxed">
              {copy.lead}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="landing-cta landing-cta-highlight"
              >
                {copy.primary}
              </Link>
              <Link to="/assess" className="landing-cta landing-cta-secondary">
                {copy.secondary}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-brand-slate font-medium">
              {copy.trustItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check
                    size={16}
                    className="text-brand-slate shrink-0"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-muted">
              <span>{copy.microcopy}</span>
              <span aria-hidden="true" className="text-brand-line-strong">
                •
              </span>
              <a
                href={copy.privacyHref}
                className="landing-link text-sm underline"
              >
                {copy.privacy}
              </a>
            </div>
          </GsapReveal>

          {/* Right Column: animated matches-app preview (Lottie, with a static phone mockup fallback) */}
          <GsapReveal className="lg:col-span-6 xl:col-span-5 relative">
            <HeroVisual copy={copy.visual} />
          </GsapReveal>
        </div>

        {/* Bottom Trust Strip seamlessly inside the canvas */}
        <div className="mt-12 sm:mt-16 border-t border-brand-line-strong pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-xs font-medium text-brand-muted">
              {copy.sourcesNote}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm font-bold tracking-tight text-brand-slate">
              {copy.sources.map((src) => (
                <span
                  key={src}
                  className="select-none inline-flex items-center gap-1.5"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-brand-orange"
                    aria-hidden="true"
                  />
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
