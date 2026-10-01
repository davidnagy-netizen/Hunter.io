import { useMetaQuery } from "@/api/meta.queries";
import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import { RotateCw } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import type { SupportedLanguage } from "@/i18n/i18n";
import type { LandingCopy } from "../../data/landingContent";
import { gsap } from "./lib/gsap";

export function StatCounter({
  copy,
  lang,
}: {
  copy: LandingCopy["stats"];
  lang: SupportedLanguage;
}) {
  const { data, isLoading, isError, refetch, isFetching } = useMetaQuery();
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || reducedMotion) return;

    const body = svg.querySelector(".stat-globe-body");
    const pulseArc = svg.querySelector(".stat-globe-arc-pulse");
    const flowArcs = svg.querySelectorAll(".stat-globe-arc-flow");
    const nodes = svg.querySelectorAll(".stat-globe-node");

    const ctx = gsap.context(() => {
      if (body) {
        gsap.to(body, {
          rotation: 360,
          svgOrigin: "250 200",
          duration: 60,
          repeat: -1,
          ease: "none",
        });
      }
      if (pulseArc) {
        gsap.to(pulseArc, {
          strokeWidth: 4.8,
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (flowArcs.length) {
        gsap.to(flowArcs, {
          strokeDashoffset: -20,
          duration: 1.4,
          repeat: -1,
          ease: "none",
        });
      }
      if (nodes.length) {
        gsap.to(nodes, {
          attr: {
            r: (_i: number, target: SVGCircleElement) =>
              Number(target.getAttribute("r")) * 1.35,
          },
          duration: 1.3,
          repeat: -1,
          yoyo: true,
          stagger: 0.15,
          ease: "sine.inOut",
        });
      }
    }, svg);

    return () => ctx.revert();
  }, [reducedMotion]);

  const total = data?.catalog?.counts?.total;
  const hasValidCount =
    typeof total === "number" && Number.isInteger(total) && total >= 0;
  const formattedCount = hasValidCount
    ? new Intl.NumberFormat(lang === "hu" ? "hu-HU" : "en-GB").format(total)
    : null;

  return (
    <section className="border-t border-brand-line bg-surface py-10 sm:py-16 lg:py-20">
      <div className="landing-canvas landing-canvas-data relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] border border-brand-slate-2 bg-brand-slate p-8 sm:p-14 lg:p-20 text-brand-cream shadow-sm">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Oversized Market Metrics (50%) */}
          <div className="flex flex-col items-start lg:col-span-6">
            <span className="text-xs font-mono font-bold tracking-widest text-brand-muted-4 uppercase mb-3 inline-block">
              {copy.eyebrow}
            </span>
            <h2 className="text-brand-cream font-bold tracking-tight">
              {copy.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-muted-4 leading-relaxed max-w-xl">
              {copy.note}
            </p>
            {/* High-impact two-metric national coverage panel */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 items-start w-full">
              {/* Metric 1: Catalogue Total */}
              <div className="flex min-h-[140px] flex-col justify-start">
                {isLoading && !data && (
                  <div
                    role="status"
                    className="text-xl font-bold text-brand-muted-4"
                  >
                    {copy.loading}
                  </div>
                )}
                {isError && !data && (
                  <div className="flex flex-col items-start gap-3">
                    <p role="alert" className="text-sm font-bold text-red">
                      {copy.error}
                    </p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="landing-cta landing-cta-secondary text-xs font-semibold"
                    >
                      <RotateCw
                        size={14}
                        className={isFetching ? "animate-spin" : ""}
                        aria-hidden="true"
                      />
                      <span>{copy.retry}</span>
                    </button>
                  </div>
                )}

                {!isLoading && !isError && !hasValidCount && (
                  <p className="text-lg font-semibold text-brand-muted-4">
                    {copy.empty}
                  </p>
                )}

                {hasValidCount && (
                  <div>
                    <div className="catalogue-number text-brand-cream font-extrabold tracking-tighter">
                      {formattedCount}
                    </div>
                    <div className="mt-3 text-lg sm:text-xl font-bold text-brand-cream tracking-tight">
                      {copy.label}
                    </div>
                    <div className="mt-1 text-xs font-medium text-brand-muted-4">
                      {copy.source}
                    </div>
                  </div>
                )}
                {isError && data && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs font-medium text-brand-orange-soft">
                      {copy.refreshError}
                    </span>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="text-xs font-bold text-brand-orange hover:underline"
                    >
                      {copy.retry}
                    </button>
                  </div>
                )}
              </div>

              {/* Metric 2: Monumental '4' Priority Regions */}
              {copy.highlightStat && copy.highlightLabel && (
                <div className="flex flex-col justify-start border-t sm:border-t-0 sm:border-l border-brand-muted/50 pt-6 sm:pt-0 sm:pl-6">
                  <div className="text-7xl sm:text-8xl lg:text-9xl font-black text-brand-orange leading-none">
                    {copy.highlightStat}
                  </div>
                  <div className="mt-3 text-lg sm:text-xl font-bold text-brand-cream tracking-tight">
                    {copy.highlightLabel}
                  </div>
                </div>
              )}
            </div>

            {/* Regional Focus Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              {copy.regions &&
                copy.regions.map((region) => (
                  <span
                    key={region}
                    className="inline-flex items-center rounded-full bg-brand-slate-2 border border-brand-muted px-3.5 py-1.5 text-xs font-bold text-brand-cream shadow-2xs"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-brand-orange mr-2"
                      aria-hidden="true"
                    />
                    {region}
                  </span>
                ))}
            </div>
          </div>

          {/* Right Column: Expansive Regional Network Infographic (50%) */}
          <div className="flex flex-col items-center lg:col-span-6 relative">
            <div className="w-full max-w-[540px]">
              <svg
                ref={svgRef}
                viewBox="0 0 500 400"
                className="w-full drop-shadow-lg"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="globeGrad" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="var(--color-brand-slate-2)" />
                    <stop offset="60%" stopColor="var(--color-brand-slate)" />
                    <stop offset="100%" stopColor="var(--color-brand-slate-3)" />
                  </radialGradient>
                  <linearGradient
                    id="arcGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="var(--color-brand-orange)" />
                    <stop offset="100%" stopColor="var(--color-brand-orange-soft)" />
                  </linearGradient>
                  <filter
                    id="glow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>
                {/* Sphere + lat/long grid: rotates together as one spinning body */}
                <g className="stat-globe-body">
                  <circle
                    cx="250"
                    cy="200"
                    r="160"
                    fill="url(#globeGrad)"
                    stroke="var(--color-brand-muted)"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                  />
                  <ellipse
                    cx="250"
                    cy="200"
                    rx="160"
                    ry="55"
                    fill="none"
                    stroke="var(--color-brand-cream)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.2"
                  />
                  <ellipse
                    cx="250"
                    cy="200"
                    rx="160"
                    ry="110"
                    fill="none"
                    stroke="var(--color-brand-cream)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.2"
                  />
                  <ellipse
                    cx="250"
                    cy="200"
                    rx="60"
                    ry="160"
                    fill="none"
                    stroke="var(--color-brand-cream)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.2"
                  />
                  <ellipse
                    cx="250"
                    cy="200"
                    rx="115"
                    ry="160"
                    fill="none"
                    stroke="var(--color-brand-cream)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.2"
                  />
                  <line
                    x1="90"
                    y1="200"
                    x2="410"
                    y2="200"
                    stroke="var(--color-brand-muted)"
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                  <line
                    x1="250"
                    y1="40"
                    x2="250"
                    y2="360"
                    stroke="var(--color-brand-muted)"
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                </g>
                {/* Regional connection arcs — fixed in place on top of the spinning globe, so the
                    network they represent stays legible while the sphere turns underneath */}
                <path
                  className="stat-globe-arc-pulse"
                  d="M 160 170 Q 250 80 340 160"
                  fill="none"
                  stroke="url(#arcGrad)"
                  strokeWidth="3.5"
                  filter="url(#glow)"
                />
                <path
                  className="stat-globe-arc-flow"
                  d="M 190 250 Q 270 160 350 230"
                  fill="none"
                  stroke="url(#arcGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="5 5"
                />
                <path
                  className="stat-globe-arc-flow"
                  d="M 170 140 Q 230 240 320 250"
                  fill="none"
                  stroke="var(--color-brand-orange)"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  opacity="0.9"
                />
                {/* Network nodes — the colored ones breathe; their static white cores don't */}
                <circle
                  className="stat-globe-node"
                  cx="160"
                  cy="170"
                  r="7"
                  fill="var(--color-brand-orange)"
                />
                <circle cx="160" cy="170" r="3" fill="var(--color-brand-cream)" />
                <circle
                  className="stat-globe-node"
                  cx="340"
                  cy="160"
                  r="8"
                  fill="var(--color-brand-orange)"
                />
                <circle cx="340" cy="160" r="3.5" fill="var(--color-brand-cream)" />
                <circle
                  className="stat-globe-node"
                  cx="190"
                  cy="250"
                  r="6"
                  fill="var(--color-brand-orange-soft)"
                />
                <circle
                  className="stat-globe-node"
                  cx="350"
                  cy="230"
                  r="6"
                  fill="var(--color-brand-orange-soft)"
                />
                <circle cx="250" cy="130" r="5" fill="var(--color-brand-cream)" />
                <circle
                  className="stat-globe-node"
                  cx="320"
                  cy="250"
                  r="7"
                  fill="var(--color-brand-orange)"
                />
                <circle
                  className="stat-globe-node"
                  cx="250"
                  cy="200"
                  r="9"
                  fill="var(--color-brand-orange)"
                />
                <circle cx="250" cy="200" r="4" fill="var(--color-brand-cream)" />
              </svg>
            </div>
            <p className="mt-4 max-w-md text-center text-xs font-medium leading-relaxed text-brand-muted-3">
              {copy.region}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
