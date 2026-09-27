import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { LandingCopy } from "../../data/landingContent";
import { gsap } from "./lib/gsap";

const AUTOPLAY_MS = 6000;

/**
 * Presents educational enterprise financing scenarios with desktop peek architecture.
 * 78% active scenario showcase paired with 22% next-slide teaser peek.
 */
export function CaseStudyCarousel({ copy }: { copy: LandingCopy["cases"] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const reducedMotion = usePrefersReducedMotion();
  const slides = copy.slides ?? [];
  const total = slides.length;

  useLayoutEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useLayoutEffect(() => {
    if (reducedMotion || total <= 1 || paused || tabHidden) return;
    const id = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, total, paused, tabHidden, currentIndex]);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const node = cardRef.current;
    if (!node || reducedMotion) return;
    gsap.fromTo(
      node,
      { opacity: 0, x: 24 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" },
    );
  }, [currentIndex, reducedMotion]);

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

  const isHu =
    copy.title.includes("Finanszírozási") || copy.action.includes("előszűrése");

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <section
      className="border-t border-[#E6E4DF] bg-[#FFFFFF] py-16 sm:py-24 lg:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setPaused(false);
      }}
    >
      <div className="landing-wrap">
        {/* Header with Title and Accessible Controls */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-[#273F4F] uppercase mb-3 inline-block">
              {copy.eyebrow}
            </span>
            <h2 className="text-[#161616] font-bold tracking-tight">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-[#687984]">
              {copy.note}
            </p>
          </div>

          {hasMultiple && (
            <div className="flex items-center gap-4">
              <span
                role="status"
                aria-live="polite"
                className="text-xs sm:text-sm font-bold text-[#273F4F]"
              >
                {currentIndex + 1} / {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={copy.previous}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D9D8D5] bg-[#FFFFFF] text-[#273F4F] hover:bg-[#F7F6F4] hover:border-[#687984] transition-colors focus-visible:rounded-xl shadow-2xs"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label={copy.next}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D9D8D5] bg-[#FFFFFF] text-[#273F4F] hover:bg-[#F7F6F4] hover:border-[#687984] transition-colors focus-visible:rounded-xl shadow-2xs"
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
            <div
              ref={cardRef}
              className="h-full rounded-3xl border border-[#202F38] bg-[#273F4F] text-[#EFEEEA] p-6 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-lg bg-[#202F38] border border-[#687984] px-3 py-1.5 text-xs font-bold text-[#EFEEEA]">
                    {currentSlide.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#BEC5CA]">
                    {String(currentIndex + 1).padStart(2, "0")}.{" "}
                    {copy.scenarioLabel}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl sm:text-3xl lg:text-4xl font-bold text-[#EFEEEA] tracking-tight">
                  {currentSlide.title}
                </h3>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#D4D9DC] max-w-3xl">
                  {currentSlide.text}
                </p>

                {/* 4 Structured Indicator Chips */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-[#202F38] border border-[#687984] p-3 shadow-2xs">
                    <span className="text-[#BEC5CA] block text-[11px]">
                      {isHu ? "Támogatási keret" : "Funding envelope"}
                    </span>
                    <span className="font-bold text-[#EFEEEA] mt-0.5 block">
                      {isHu ? "20M – 150M Ft" : "€50k – €400k"}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#202F38] border border-[#687984] p-3 shadow-2xs">
                    <span className="text-[#BEC5CA] block text-[11px]">
                      {isHu ? "Támogatási intenzitás" : "Funding intensity"}
                    </span>
                    <span className="font-bold text-[#FE7743] mt-0.5 block">
                      50% – 70%
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#202F38] border border-[#687984] p-3 shadow-2xs">
                    <span className="text-[#BEC5CA] block text-[11px]">
                      {isHu ? "Felkészültség" : "Readiness"}
                    </span>
                    <span className="font-bold text-[#EFEEEA] mt-0.5 block">
                      Standard KSH audit
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#202F38] border border-[#687984] p-3 shadow-2xs">
                    <span className="text-[#BEC5CA] block text-[11px]">
                      {isHu ? "Átfutási idő" : "Timeline"}
                    </span>
                    <span className="font-bold text-[#EFEEEA] mt-0.5 block">
                      {isHu ? "3–5 hónap" : "3–5 months"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-[#202F38] pt-6">
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
                aria-label={
                  copy.viewAction ||
                  (isHu ? "Forgatókönyv megnyitása" : "View scenario")
                }
                className="w-full text-left rounded-3xl border border-[#D9D8D5] bg-[#EFEEEA] hover:bg-[#F7F6F4] hover:border-[#687984] p-6 flex flex-col justify-between shadow-2xs transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#687984] uppercase tracking-wider mb-4 pb-2 border-b border-[#D9D8D5]">
                    <span>
                      {isHu ? "Következő forgatókönyv" : "Next scenario"}
                    </span>
                    <span className="text-[#273F4F] font-bold">
                      {String(nextIndex + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <span className="inline-flex items-center rounded-lg bg-[#FFFFFF] border border-[#D9D8D5] px-2.5 py-1 text-xs font-semibold text-[#161616]">
                    {nextSlide.category}
                  </span>

                  <p className="mt-4 text-xs sm:text-sm text-[#273F4F] leading-relaxed group-hover:text-[#161616] transition-colors">
                    {isHu
                      ? "Kattintson az esettanulmány részletes feltételeinek és intenzitásának megtekintéséhez."
                      : "Click to explore criteria, funding intensity, and timeline parameters."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#D9D8D5] flex items-center justify-between text-xs font-bold text-[#273F4F]">
                  <span>
                    {copy.viewAction ||
                      (isHu ? "Forgatókönyv megnyitása" : "View scenario")}
                  </span>
                  <ArrowRight
                    size={15}
                    className="text-[#FE7743] group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
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
                aria-current={idx === currentIndex ? "true" : undefined}
                aria-label={`${copy.select}: ${slide.title}`}
                className={`h-3 rounded-full transition-all focus-visible:rounded-full min-w-[20px] ${
                  idx === currentIndex
                    ? "w-10 bg-[#FE7743]"
                    : "w-3 bg-[#D4D9DC] hover:bg-[#939FA7]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
