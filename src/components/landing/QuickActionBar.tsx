import { Link } from 'react-router';
import { Check, Building2, ShieldCheck } from 'lucide-react';
import type { LandingCopy } from '../../data/landingContent';

/**
 * High-fidelity conversion terminal directing visitors into official tax registration.
 * Deep obsidian canvas with official business lookup UI mockup and 3-stage registration flow.
 */
export function QuickActionBar({ copy }: { copy: LandingCopy['quickAction'] }) {
  const isHu = copy.title.includes('adószámával') || copy.action.includes('Adószám');

  return (
    <section className="bg-surface py-14 sm:py-20 lg:py-24 border-t border-brand-line">
      <div className="landing-canvas landing-canvas-conversion relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-brand-slate text-brand-cream p-8 sm:p-12 lg:p-16 border border-brand-slate-2 shadow-2xl min-h-[320px] sm:min-h-[360px]">
        {/* Subtle background glow */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-orange/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Conversion Callout (55%) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <span className="text-xs font-mono font-bold tracking-widest text-brand-orange-soft uppercase mb-3 sm:mb-4 inline-block">
              {copy.eyebrow}
            </span>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight !text-brand-cream text-brand-cream leading-[1.1] max-w-xl">
              {copy.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-brand-muted-4 leading-relaxed max-w-lg">
              {copy.text}
            </p>

            <div className="mt-8">
              <Link
                to="/register"
                className="landing-cta"
              >
                <span>{copy.action}</span>
              </Link>
            </div>

            {/* 3-stage progress indicators below CTA */}
            <div className="mt-8 pt-6 border-t border-brand-muted/50 w-full max-w-xl">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-brand-muted-3 mb-3">
                {isHu ? '3 szakaszos regisztrációs folyamat' : '3-stage registration architecture'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {copy.steps && copy.steps.map((step, idx) => (
                  <div
                    key={step}
                    className="flex items-center gap-2.5 rounded-xl bg-brand-slate-3 border border-brand-muted px-3 py-2.5 text-xs"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-slate-2 text-brand-orange font-mono text-[11px] font-bold">
                      0{idx + 1}
                    </span>
                    <span className="text-brand-muted-4 font-medium truncate">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Substantial Official Business Lookup UI Mockup (45%) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-brand-muted bg-brand-ink p-6 sm:p-7 shadow-xl">
              {/* Top terminal bar */}
              <div className="flex items-center justify-between border-b border-brand-slate pb-3.5 mb-5">
                <div className="flex items-center gap-2 text-xs font-mono font-medium text-brand-muted-3">
                  <span className="rounded bg-brand-slate px-2 py-0.5 text-brand-cream font-bold">HU</span>
                  <span>{isHu ? 'NAV Online Számla' : 'NAV Online Invoice'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-brand-orange-soft">
                  <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" aria-hidden="true" />
                  <span>{isHu ? 'Kapcsolat: Aktív' : 'Connection: Active'}</span>
                </div>
              </div>

              {/* Input mock field */}
              <div>
                <label className="text-xs font-semibold text-brand-muted-3 block mb-1.5">
                  {isHu ? 'Cég adószáma (CDV ellenőrzött)' : 'Company tax number (CDV verified)'}
                </label>
                <div className="flex items-center justify-between rounded-xl bg-brand-slate-3 border border-brand-muted px-4 py-3 font-mono text-sm sm:text-base text-brand-cream">
                  <span>12345678-1-23</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-slate px-2 py-0.5 text-xs font-semibold text-brand-cream border border-brand-orange">
                    <Check size={12} className="text-brand-orange" aria-hidden="true" />
                    <span>CDV OK</span>
                  </span>
                </div>
              </div>

              {/* Verified company result card */}
              <div className="mt-4 rounded-2xl bg-brand-slate-3 border border-brand-muted p-4 sm:p-5">
                <div className="flex items-center justify-between text-xs text-brand-muted-3 border-b border-brand-slate pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5 font-semibold text-brand-cream">
                    <Building2 size={13} className="text-brand-orange" aria-hidden="true" />
                    <span>{isHu ? 'Hivatalos cégadatok' : 'Official taxpayer record'}</span>
                  </div>
                  <span className="rounded bg-brand-slate px-2 py-0.5 text-[11px] font-mono text-brand-muted-3">
                    {isHu ? 'Mintaadat' : 'Demo data'}
                  </span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-xs text-brand-muted-3 block">{isHu ? 'Hivatalos név:' : 'Company name:'}</span>
                    <span className="font-bold text-brand-cream text-sm sm:text-base">Minta Vállalkozás Kft.</span>
                  </div>
                  <div>
                    <span className="text-xs text-brand-muted-3 block">{isHu ? 'Székhely:' : 'Seat address:'}</span>
                    <span className="text-brand-muted-4">1054 Budapest, Szabadság tér 7.</span>
                  </div>
                  <div>
                    <span className="text-xs text-brand-muted-3 block">{isHu ? 'Főtevékenység:' : 'Primary activity:'}</span>
                    <span className="font-mono text-xs text-brand-orange-soft">6201 - Egyedi szoftverfejlesztés</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-slate flex items-center justify-between text-xs">
                  <span className="text-brand-muted-3">{isHu ? 'Előszűrési állapot:' : 'Screening status:'}</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-brand-orange">
                    <ShieldCheck size={14} className="text-brand-orange" aria-hidden="true" />
                    <span className="text-brand-cream">{isHu ? 'Előszűrésre kész' : 'Ready for screening'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
