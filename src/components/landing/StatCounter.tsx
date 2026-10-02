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

    const pulseArc = svg.querySelector(".stat-globe-arc-pulse");
    const flowArcs = svg.querySelectorAll(".stat-globe-arc-flow");
    const nodes = svg.querySelectorAll(".stat-globe-node");

    const ctx = gsap.context(() => {
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
      <div className="landing-canvas landing-canvas-data relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] border border-brand-line bg-slate-50 p-8 sm:p-14 lg:p-20 text-brand-ink shadow-sm">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Oversized Market Metrics (50%) */}
          <div className="flex flex-col items-start lg:col-span-6">
            <span className="text-xs font-mono font-bold tracking-widest text-brand-slate uppercase mb-3 inline-block">
              {copy.eyebrow}
            </span>
            <h2 className="text-brand-ink font-bold tracking-tight">
              {copy.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-slate leading-relaxed max-w-xl">
              {copy.note}
            </p>
            {/* High-impact two-metric national coverage panel */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 items-start w-full">
              {/* Metric 1: Catalogue Total */}
              <div className="flex min-h-[140px] flex-col justify-start">
                {isLoading && !data && (
                  <div
                    role="status"
                    className="text-xl font-bold text-brand-slate"
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
                  <p className="text-lg font-semibold text-brand-slate">
                    {copy.empty}
                  </p>
                )}

                {hasValidCount && (
                  <div>
                    <div className="catalogue-number text-brand-ink font-extrabold tracking-tighter">
                      {formattedCount}
                    </div>
                    <div className="mt-3 text-lg sm:text-xl font-bold text-brand-ink tracking-tight">
                      {copy.label}
                    </div>
                    <div className="mt-1 text-xs font-medium text-brand-slate">
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
                <div className="flex flex-col justify-start border-t sm:border-t-0 sm:border-l border-brand-line pt-6 sm:pt-0 sm:pl-6">
                  <div className="text-7xl sm:text-8xl lg:text-9xl font-black text-brand-orange-deep leading-none">
                    {copy.highlightStat}
                  </div>
                  <div className="mt-3 text-lg sm:text-xl font-bold text-brand-ink tracking-tight">
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
                    className="inline-flex items-center rounded-full bg-white border border-brand-line-strong px-3.5 py-1.5 text-xs font-bold text-brand-ink shadow-2xs"
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
            <div className="w-full max-w-[540px] rounded-3xl bg-white p-3 sm:p-5 border border-brand-line-strong shadow-xs">
              <svg
                ref={svgRef}
                viewBox="0 0 500 320"
                className="w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="huGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f8fafc" />
                  </linearGradient>
                  <linearGradient id="huArc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-brand-orange)" />
                    <stop offset="100%" stopColor="var(--color-brand-orange-soft)" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#e2e8f0" opacity="0.6" />
                  </pattern>
                </defs>

                {/* Pure white background card with subtle grid */}
                <rect width="100%" height="100%" rx="16" fill="#ffffff" />
                <rect width="100%" height="100%" rx="16" fill="url(#dotGrid)" />

                {/* Hungary National Map Outline */}
                <path
                  d="M 64 115 C 66 102, 80 92, 104 84 C 126 78, 144 94, 168 100 C 188 104, 204 94, 222 92 C 230 92, 234 82, 248 76 C 270 66, 292 70, 316 52 C 340 38, 358 38, 376 42 C 392 44, 408 50, 426 54 C 448 60, 464 76, 472 94 C 476 108, 454 120, 436 126 C 416 134, 406 156, 396 172 C 384 188, 380 208, 364 224 C 348 238, 324 244, 294 248 C 274 252, 252 246, 232 258 C 214 268, 196 280, 174 278 C 152 274, 132 266, 114 258 C 92 248, 78 236, 62 220 C 46 204, 32 188, 38 172 C 42 152, 50 134, 64 115 Z"
                  fill="#ffffff"
                  stroke="#94a3b8"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

                {/* Hungary Internal Regional Boundaries (Subtle dashed county clusters) */}
                <g stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="3 3" fill="none" opacity="0.65">
                  <path d="M 229 130 L 195 155 L 175 195 L 160 270" />
                  <path d="M 229 130 L 270 100 L 310 90 L 370 70" />
                  <path d="M 229 130 L 285 160 L 340 190 L 375 220" />
                  <path d="M 295 235 L 340 210 L 405 130" />
                </g>

                {/* Highway Network / Jalan Raya Utama (M-roads network) */}
                <g stroke="#e2e8f0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {/* M0 Budapest Ring */}
                  <ellipse cx="229" cy="130" rx="18" ry="15" />
                  {/* M1: Budapest - Győr */}
                  <path d="M 220 125 Q 170 110 125 105 Q 100 100 80 95" />
                  {/* M7: Budapest - Balaton */}
                  <path d="M 224 135 Q 195 150 160 165 Q 130 180 85 215" />
                  {/* M6: Budapest - Pécs */}
                  <path d="M 229 138 Q 224 180 205 220 Q 185 240 155 250" />
                  {/* M5: Budapest - Szeged */}
                  <path d="M 233 138 Q 260 185 295 235" />
                  {/* M3: Budapest - Miskolc / Debrecen */}
                  <path d="M 235 125 Q 280 105 345 80" />
                  <path d="M 290 105 Q 345 115 405 130" />
                  {/* Route 47 & 8 */}
                  <path d="M 195 150 Q 150 155 55 165" />
                  <path d="M 405 130 Q 370 180 345 205 Q 320 220 295 235" />
                  <path d="M 125 105 Q 75 140 55 200" />
                </g>

                {/* Highway lines overlay */}
                <g stroke="#cbd5e1" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="229" cy="130" rx="18" ry="15" strokeDasharray="4 2" />
                  <path d="M 220 125 Q 170 110 125 105 Q 100 100 80 95" />
                  <path d="M 224 135 Q 195 150 160 165 Q 130 180 85 215" />
                  <path d="M 229 138 Q 224 180 205 220 Q 185 240 155 250" />
                  <path d="M 233 138 Q 260 185 295 235" />
                  <path d="M 235 125 Q 280 105 345 80" />
                  <path d="M 290 105 Q 345 115 405 130" />
                  <path d="M 195 150 Q 150 155 55 165" strokeDasharray="3 3" />
                  <path d="M 405 130 Q 370 180 345 205 Q 320 220 295 235" strokeDasharray="3 3" />
                  <path d="M 125 105 Q 75 140 55 200" strokeDasharray="3 3" />
                </g>

                {/* Highway Route Badges (Subtle road markers) */}
                <g fontSize="7" fontFamily="monospace" fontWeight="700" fill="#64748b" textAnchor="middle">
                  <rect x="165" y="99" width="14" height="9" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="172" y="106">M1</text>

                  <rect x="290" y="85" width="14" height="9" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="297" y="92">M3</text>

                  <rect x="264" y="180" width="14" height="9" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="271" y="187">M5</text>

                  <rect x="180" y="145" width="14" height="9" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="187" y="152">M7</text>
                </g>

                {/* Danube River (Duna) - bending south at Dunakanyar */}
                <path
                  d="M 104 84 Q 168 100 216 93 Q 226 93 229 108 L 229 130 Q 229 175 225 215 Q 220 250 206 276"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  opacity="0.75"
                />

                {/* Tisza River */}
                <path
                  d="M 426 54 Q 380 75 355 102 Q 330 132 336 165 Q 340 198 320 224 Q 302 238 294 248"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.65"
                />

                {/* Lake Balaton */}
                <path
                  d="M 134 182 C 148 174, 168 166, 186 158 C 182 165, 162 176, 136 186 Z"
                  fill="#bae6fd"
                  stroke="#0284c7"
                  strokeWidth="1.2"
                  opacity="0.95"
                />

                {/* Regional Network Arcs (Connecting cities to Budapest) */}
                <path d="M 125 105 Q 175 95 229 130" fill="none" stroke="url(#huArc)" strokeWidth="2.5" className="stat-globe-arc-flow" strokeDasharray="5 5" />
                <path d="M 345 80 Q 285 90 229 130" fill="none" stroke="url(#huArc)" strokeWidth="2.5" className="stat-globe-arc-pulse" filter="url(#glow)" />
                <path d="M 405 130 Q 315 115 229 130" fill="none" stroke="url(#huArc)" strokeWidth="2" className="stat-globe-arc-flow" strokeDasharray="6 4" opacity="0.9" />
                <path d="M 295 235 Q 265 180 229 130" fill="none" stroke="url(#huArc)" strokeWidth="2.5" className="stat-globe-arc-pulse" />
                <path d="M 155 250 Q 185 190 229 130" fill="none" stroke="url(#huArc)" strokeWidth="2" className="stat-globe-arc-flow" strokeDasharray="5 5" />

                {/* Secondary Town Nodes */}
                <circle cx="195" cy="150" r="3" fill="#94a3b8" />
                <text x="195" y="160" fontSize="8" fontFamily="inherit" fill="#64748b" textAnchor="middle">Fehérvár</text>

                <circle cx="265" cy="180" r="3" fill="#94a3b8" />
                <text x="265" y="191" fontSize="8" fontFamily="inherit" fill="#64748b" textAnchor="middle">Kecskemét</text>

                <circle cx="55" cy="155" r="3" fill="#94a3b8" />
                <text x="55" y="166" fontSize="8" fontFamily="inherit" fill="#64748b" textAnchor="middle">Szombathely</text>

                <circle cx="430" cy="98" r="3" fill="#94a3b8" />
                <text x="430" y="108" fontSize="8" fontFamily="inherit" fill="#64748b" textAnchor="middle">Nyíregyháza</text>

                {/* Primary Regional Hub Nodes */}
                {/* Győr */}
                <circle cx="125" cy="105" r="5" fill="var(--color-brand-orange)" className="stat-globe-node" />
                <circle cx="125" cy="105" r="2" fill="#ffffff" />
                <text x="125" y="93" fontSize="10" fontFamily="inherit" fontWeight="700" fill="#334155" textAnchor="middle">Győr</text>

                {/* Pécs */}
                <circle cx="155" cy="250" r="5" fill="var(--color-brand-orange)" className="stat-globe-node" />
                <circle cx="155" cy="250" r="2" fill="#ffffff" />
                <text x="155" y="266" fontSize="10" fontFamily="inherit" fontWeight="700" fill="#334155" textAnchor="middle">Pécs</text>

                {/* Miskolc */}
                <circle cx="345" cy="80" r="5" fill="var(--color-brand-orange)" className="stat-globe-node" />
                <circle cx="345" cy="80" r="2" fill="#ffffff" />
                <text x="345" y="69" fontSize="10" fontFamily="inherit" fontWeight="700" fill="#334155" textAnchor="middle">Miskolc</text>

                {/* Debrecen */}
                <circle cx="405" cy="130" r="6" fill="var(--color-brand-orange)" className="stat-globe-node" />
                <circle cx="405" cy="130" r="2.5" fill="#ffffff" />
                <text x="405" y="148" fontSize="10" fontFamily="inherit" fontWeight="700" fill="#334155" textAnchor="middle">Debrecen</text>

                {/* Szeged */}
                <circle cx="295" cy="235" r="6" fill="var(--color-brand-orange)" className="stat-globe-node" />
                <circle cx="295" cy="235" r="2.5" fill="#ffffff" />
                <text x="295" y="252" fontSize="10" fontFamily="inherit" fontWeight="700" fill="#334155" textAnchor="middle">Szeged</text>

                {/* Budapest (Capital Central Hub) */}
                <circle cx="229" cy="130" r="15" fill="var(--color-brand-orange)" fillOpacity="0.2" className="stat-globe-node" />
                <circle cx="229" cy="130" r="8" fill="var(--color-brand-orange)" />
                <circle cx="229" cy="130" r="3.5" fill="#ffffff" />
                <text x="229" y="110" fontSize="12" fontFamily="inherit" fontWeight="800" fill="#0f172a" textAnchor="middle">Budapest</text>

                {/* Balaton Label */}
                <text x="160" y="180" fontSize="8" fontFamily="inherit" fontWeight="600" fill="#0284c7" textAnchor="middle" fontStyle="italic">Balaton</text>

                {/* National Coverage Pill Badge */}
                <g transform="translate(16, 16)">
                  <rect width="136" height="26" rx="13" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
                  <circle cx="13" cy="13" r="4" fill="#10b981" />
                  <text x="24" y="16.5" fontSize="10" fontFamily="inherit" fontWeight="700" fill="#334155">Magyarország kkv</text>
                </g>
              </svg>
            </div>
            <p className="mt-4 max-w-md text-center text-xs font-medium leading-relaxed text-brand-slate">
              {copy.region}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
