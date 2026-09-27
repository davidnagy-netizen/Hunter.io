import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Presents educational enterprise financing scenarios with desktop peek architecture.
 * 78% active scenario showcase paired with 22% next-slide teaser peek.
 */
export function CaseStudyCarousel({ copy }: { copy: LandingCopy['cases'] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = copy.slides ?? [];
  const total = slides.length;

  if (total === 0) {
    return (
      <section className="bg-white py-16 lg:py-24">
        <div className="landing-wrap">
          <p className="text-center text-slate-500">{copy.empty}</p>
        </div>
      </section>
    );
  }

  const currentSlide = slides[currentIndex];
  const nextIndex = (currentIndex + 1) % total;
  const nextSlide = slides[nextIndex];
  const hasMultiple = total > 1;

  const isHu = copy.title.includes('Finanszírozási') || copy.action.includes('előszűrése');

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <section className="border-t border-slate-200/80 bg-white py-16 sm:py-24 lg:py-28">
      <div className="landing-wrap">
        {/* Header with Title and Accessible Controls */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-blue-700 uppercase mb-3 inline-block">
              {copy.eyebrow}
            </span>
            <h2 className="text-slate-950 font-bold tracking-tight">{copy.title}</h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-500">{copy.note}</p>
          </div>

          {hasMultiple && (
            <div className="flex items-center gap-4">
              <span role="status" aria-live="polite" className="text-xs sm:text-sm font-bold text-slate-600">
                {currentIndex + 1} / {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={copy.previous}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors focus-visible:rounded-xl shadow-2xs"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label={copy.next}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors focus-visible:rounded-xl shadow-2xs"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 78% Active Showcase / 22% Next Peek Desktop Grid */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Active Scenario Card (78% / 9 cols on lg) */}
          <div className="lg:col-span-9">
            <div className="landing-card-highlight h-full rounded-3xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-white to-white p-6 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-lg bg-blue-100/90 border border-blue-200/80 px-3 py-1.5 text-xs font-bold text-blue-900">
                    {currentSlide.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {String(currentIndex + 1).padStart(2, '0')}. {copy.scenarioLabel}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-950 tracking-tight">
                  {currentSlide.title}
                </h3>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 max-w-3xl">
                  {currentSlide.text}
                </p>

                {/* 4 Structured Indicator Chips */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">
                      {isHu ? 'Támogatási keret' : 'Funding envelope'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {isHu ? '20M – 150M Ft' : '€50k – €400k'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">
                      {isHu ? 'Támogatási intenzitás' : 'Funding intensity'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      50% – 70%
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">
                      {isHu ? 'Felkészültség' : 'Readiness'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      Standard KSH audit
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
                    <span className="text-slate-500 block text-[11px]">
                      {isHu ? 'Átfutási idő' : 'Timeline'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {isHu ? '3–5 hónap' : '3–5 months'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-blue-100/80 pt-6">
                <Link to="/assess" className="landing-cta font-semibold">
                  {copy.action}
                </Link>
              </div>
            </div>
          </div>

          {/* Next Slide Teaser Peek (22% / 3 cols on lg, desktop only) */}
          {hasMultiple && (
            <div className="hidden lg:flex lg:col-span-3">
              <button
                type="button"
                onClick={handleNext}
                aria-label={copy.viewAction || (isHu ? 'Forgatókönyv megnyitása' : 'View scenario')}
                className="w-full text-left rounded-3xl border border-slate-200/90 bg-slate-50/80 hover:bg-blue-50/50 hover:border-blue-200/80 p-6 flex flex-col justify-between shadow-2xs transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200/60">
                    <span>{isHu ? 'Következő forgatókönyv' : 'Next scenario'}</span>
                    <span className="text-blue-600 font-bold">{String(nextIndex + 1).padStart(2, '0')}</span>
                  </div>

                  <span className="inline-flex items-center rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {nextSlide.category}
                  </span>

                  <p className="mt-4 text-xs sm:text-sm text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                    {isHu
                      ? 'Kattintson az esettanulmány részletes feltételeinek és intenzitásának megtekintéséhez.'
                      : 'Click to explore criteria, funding intensity, and timeline parameters.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-700">
                  <span>{copy.viewAction || (isHu ? 'Forgatókönyv megnyitása' : 'View scenario')}</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Pagination Dots with Accessible Focus */}
        {hasMultiple && (
          <div className="mt-8 flex items-center justify-center gap-2.5">
            {slides.map((slide, idx) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-current={idx === currentIndex ? 'true' : undefined}
                aria-label={`${copy.select}: ${slide.title}`}
                className={`h-3 rounded-full transition-all focus-visible:rounded-full min-w-[20px] ${
                  idx === currentIndex ? 'w-10 bg-blue-700' : 'w-3 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
