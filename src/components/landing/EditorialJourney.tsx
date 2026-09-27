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
    <section className="bg-white py-14 sm:py-20 lg:py-24 border-t border-slate-200/80">
      <div className="landing-canvas relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-[#090d16] text-white p-6 sm:p-10 lg:p-14 border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Authentic Workplace Photo Landmark (50% / 6 cols) */}
          <div className="lg:col-span-6 relative">
            <div className="relative min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] w-full rounded-3xl overflow-hidden border border-slate-700/80 shadow-xl bg-slate-900 flex items-center justify-center">
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
                  className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-slate-400 bg-slate-900"
                >
                  <span>{copy.imageError}</span>
                </div>
              )}

              {/* Scrim Overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"
                aria-hidden="true"
              />

              {/* Floating Quality Badge */}
              <div className="absolute bottom-6 left-6 right-6 sm:right-auto z-10">
                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/90 px-4 py-3 shadow-lg backdrop-blur-md">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">{copy.badge}</span>
                    <span className="text-[11px] font-mono text-slate-400 block">KSH & NAV szabvány</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Narrative & 3-Step Verification Journey (50% / 6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-3 sm:mb-4 inline-block">
              {copy.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white !text-white leading-[1.15]">
              {copy.title}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              {copy.lead}
            </p>

            {/* 3-Step Verification Journey */}
            <div className="mt-8 space-y-4 w-full">
              {copy.steps.map((step) => (
                <div
                  key={step.num}
                  className="flex items-start gap-4 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 transition-colors hover:border-slate-700"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600/30 text-blue-400 font-mono text-xs font-bold border border-blue-500/30 mt-0.5">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white !text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
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
                className="landing-cta bg-blue-600 hover:bg-blue-500 border-blue-500 text-white font-semibold min-h-[52px] text-[17px] px-8 shadow-lg inline-flex items-center gap-2"
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
