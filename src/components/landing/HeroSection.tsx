import { Check, Clock } from "lucide-react";
import { Link } from "react-router";
import type { LandingCopy } from "../../data/landingContent";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { GsapReveal } from "./GsapReveal";

/**
 * Presents Fundor's grant pre-screening value proposition and illustrative product previews.
 * 12-column institutional layout with structured pre-screening application preview.
 */
export function HeroSection({ copy }: { copy: LandingCopy["hero"] }) {
  return (
    <section className="relative overflow-hidden bg-[#FFFFFF] py-6 sm:py-10 lg:py-14 border-b border-[#E6E4DF]">
      <div className="landing-canvas landing-canvas-hero relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] border border-[#D9D8D5] bg-[#EFEEEA] p-6 sm:p-10 lg:p-14 shadow-sm">
        {/* Subtle decorative grid network */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04] text-[#273F4F]"
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
            <h1 className="text-[#161616] font-bold tracking-tight max-w-[650px]">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg sm:text-xl text-[#273F4F] leading-relaxed">
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

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-[#273F4F] font-medium">
              {copy.trustItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check
                    size={16}
                    className="text-[#273F4F] shrink-0"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#687984]">
              <span>{copy.microcopy}</span>
              <span aria-hidden="true" className="text-[#D9D8D5]">
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

          {/* Right Column: Substantial Financial Intelligence Interface */}
          <GsapReveal className="lg:col-span-6 xl:col-span-5 relative">
            <div className="mb-2.5 flex items-center justify-between text-xs text-[#687984]">
              <span className="font-semibold text-[#273F4F] flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full bg-[#FE7743] inline-block"
                  aria-hidden="true"
                />
                {copy.dashboard}
              </span>
              <span>{copy.preview}</span>
            </div>

            <div className="landing-card-elevated relative rounded-2xl border border-[#D9D8D5] bg-[#FFFFFF] p-5 sm:p-7 shadow-lg">
              {/* Window Controls & URL bar */}
              <div className="flex items-center justify-between border-b border-[#E6E4DF] pb-3.5 mb-4">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#D9D8D5]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#D9D8D5]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#D9D8D5]" />
                </div>
                <div className="rounded-md bg-[#F7F6F4] px-3 py-1 text-[11px] font-mono font-medium text-[#687984] border border-[#E6E4DF]">
                  fundor.hu/app/pre-screen
                </div>
                <span className="inline-flex items-center rounded-md bg-[#FFF1EC] px-2 py-0.5 text-xs font-semibold text-[#161616] border border-[#FE7743]">
                  {copy.brand}
                </span>
              </div>

              {/* Profile Inputs Mock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-[#F7F6F4] p-3 border border-[#E6E4DF]">
                  <div className="text-[#687984] font-medium">
                    {copy.profileMock.sizeLabel}
                  </div>
                  <div className="font-bold text-[#161616] mt-0.5">
                    {copy.profileMock.sizeValue}
                  </div>
                </div>
                <div className="rounded-xl bg-[#F7F6F4] p-3 border border-[#E6E4DF]">
                  <div className="text-[#687984] font-medium">
                    {copy.profileMock.goalLabel}
                  </div>
                  <div className="font-bold text-[#161616] mt-0.5">
                    {copy.profileMock.goalValue}
                  </div>
                </div>
                <div className="sm:col-span-2 rounded-xl bg-[#F7F6F4] p-3 border border-[#E6E4DF]">
                  <div className="text-[#687984] font-medium">
                    {copy.category}
                  </div>
                  <div className="font-bold text-[#161616] mt-0.5">
                    {copy.grant}
                  </div>
                </div>
              </div>

              {/* Primary Score Evaluation Module */}
              <div className="mt-4 rounded-xl border border-[#FE7743] bg-[#FFF1EC] p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#273F4F]">
                      {copy.score}
                    </div>
                    <div className="mt-0.5 text-3xl sm:text-4xl font-extrabold text-[#161616] tracking-tight">
                      {copy.scoreValue}
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#273F4F] px-3 py-1 text-xs font-bold text-[#EFEEEA]">
                    {copy.statusLabel}
                  </span>
                </div>
                <div className="mt-2 text-xs font-medium text-[#273F4F]">
                  {copy.scoreNote}
                </div>
              </div>

              {/* Secondary Readiness Progress */}
              <div className="mt-3.5 rounded-xl border border-[#D9D8D5] bg-[#FAFAF9] p-3.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#161616] mb-1.5">
                  <span>{copy.readiness}</span>
                  <span className="font-bold text-[#273F4F]">
                    {copy.metrics.readinessScore}
                  </span>
                </div>
                <AnimatedProgressBar
                  value={parseInt(copy.metrics.readinessScore, 10)}
                  className="h-2 w-full rounded-full bg-[#E6E4DF] overflow-hidden"
                  fillClassName="bg-[#FE7743]"
                  ariaLabel={copy.readiness}
                />
                <p className="mt-2 leading-relaxed text-[#273F4F]">
                  {copy.readinessNote}
                </p>
              </div>

              {/* Overlapping Contextual Chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9D8D5] bg-[#F7F6F4] px-3 py-1.5 text-xs font-semibold text-[#161616] shadow-2xs">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#FE7743]"
                    aria-hidden="true"
                  />
                  <span>
                    {copy.metrics.matchCount} {copy.metrics.matchLabel}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9D8D5] bg-[#F7F6F4] px-3 py-1.5 text-xs font-semibold text-[#273F4F]">
                  <Clock
                    size={13}
                    className="text-[#687984] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {copy.metrics.timeEstimate} {copy.metrics.timeLabel}
                  </span>
                </div>
              </div>

              {/* Eligibility Disclosure */}
              <div className="mt-4 border-t border-[#E6E4DF] pt-3 text-[11px] leading-normal text-[#687984]">
                {copy.amount}
              </div>
            </div>
          </GsapReveal>
        </div>

        {/* Bottom Trust Strip seamlessly inside the canvas */}
        <div className="mt-12 sm:mt-16 border-t border-[#D9D8D5] pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-xs font-medium text-[#687984]">
              {copy.sourcesNote}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm font-bold tracking-tight text-[#273F4F]">
              {copy.sources.map((src) => (
                <span
                  key={src}
                  className="select-none inline-flex items-center gap-1.5"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#FE7743]"
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
