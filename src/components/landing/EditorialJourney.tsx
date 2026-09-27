import { useState } from 'react';
import { Link } from 'react-router';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import journeyEngineering from '@/features/landing/assets/journey-engineering.jpg';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Editorial SME engineering photo story anchoring the transition from abstract eligibility to real-world execution.
 * Presents a 3-step structured verification journey alongside verified European workplace imagery.
 */
export function EditorialJourney({ copy }: { copy: LandingCopy['journey'] }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section className="bg-[#FFFFFF] py-14 sm:py-20 lg:py-24 border-t border-[#E6E4DF]">
      <div className="landing-canvas landing-canvas-photo relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-[#161616] text-[#EFEEEA] p-6 sm:p-10 lg:p-14 border border-[#273F4F] shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Authentic Workplace Photo Landmark (50% / 6 cols) */}
          <div className="lg:col-span-6 relative">
            <div className="relative min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] w-full rounded-3xl overflow-hidden border border-[#687984] shadow-xl bg-[#1E2A32] flex items-center justify-center">
              {!imgFailed ? (
                <img
                  src={journeyEngineering}
                  alt={copy.alt}
                  loading="lazy"
                  onError={() => setImgFailed(true)}
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-85 mix-blend-luminosity scale-105"
                />
              ) : (
                <div
                  role="img"
                  aria-label={copy.alt}
                  className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-[#939FA7] bg-[#1E2A32]"
                >
                  <span>{copy.imageError}</span>
                </div>
              )}
              {/* Scrim Overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/40 to-transparent"
                aria-hidden="true"
              />

              {/* Floating Quality Badge */}
              <div className="absolute bottom-6 left-6 right-6 sm:right-auto z-10">
                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-[#273F4F]/95 border border-[#687984] px-4 py-3 shadow-lg backdrop-blur-md">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E2A32] text-[#FE7743] border border-[#687984]">
                    <ShieldCheck size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#EFEEEA] block">{copy.badge}</span>
                    <span className="text-[11px] font-mono text-[#BEC5CA] block">KSH & NAV szabvány</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Narrative & 3-Step Verification Journey (50% / 6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-xs font-mono font-bold tracking-widest text-[#FEA07B] uppercase mb-3 sm:mb-4 inline-block">
              {copy.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#EFEEEA] !text-[#EFEEEA] leading-[1.15]">
              {copy.title}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#D4D9DC] leading-relaxed">
              {copy.lead}
            </p>

            {/* 3-Step Verification Journey */}
            <div className="mt-8 space-y-4 w-full">
              {copy.steps.map((step) => (
                <div
                  key={step.num}
                  className="flex items-start gap-4 rounded-2xl bg-[#1E2A32] border border-[#687984] p-4 sm:p-5 transition-colors hover:border-[#FE7743]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#202F38] text-[#FE7743] font-mono text-xs font-bold border border-[#687984] mt-0.5">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#EFEEEA] !text-[#EFEEEA]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-[#BEC5CA] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action button */}
            <div className="mt-8">
              <Link
                to="/assess"
                className="landing-cta"
              >
                <span>{copy.action}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
