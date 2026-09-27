import { Link } from 'react-router';
import { Check, ShieldAlert } from 'lucide-react';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Compares free profile pre-screening with Fundor Plus evaluation and documentation capabilities.
 * Adapts subscription tier layouts into honest service tiers without fabricated prices, payment links, or automated application guarantees.
 */
export function PlanCards({
  copy,
  hasProfile,
  disclaimer,
}: {
  copy: LandingCopy['plans'];
  hasProfile: boolean;
  disclaimer: string;
}) {
  return (
    <section id="fundor-plus" className="bg-white py-12 sm:py-16 lg:py-20 border-t border-slate-200/80">
      <div className="landing-canvas relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-[#f1f5f9] border border-slate-200/80 p-8 sm:p-12 lg:p-16 shadow-sm">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />
            <span>{copy.title.includes('Előszűrés') ? 'FELKÉSZÜLÉSI SZINTEK' : 'PREPARATION PATHWAYS'}</span>
          </span>
          <h2 className="text-slate-950 font-bold tracking-tight">{copy.title}</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
          {/* Left Pathway: Free Basic Tier */}
          <div className="landing-card-elevated flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-md">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Alap szint
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                {copy.free}
              </h3>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">{copy.freeText}</p>

              <ul className="mt-8 space-y-3.5">
                {copy.freeItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                    <Check size={18} className="mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col gap-3.5 border-t border-slate-100 pt-6">
              <Link to="/assess" className="landing-cta landing-cta-secondary w-full font-semibold min-h-[50px]">
                {copy.freeAction}
              </Link>
              <Link to="/register" className="landing-link justify-center text-center text-xs font-semibold">
                {copy.accountAction}
              </Link>
            </div>
          </div>

          {/* Right Pathway: Fundor Plus Tier (Deep Navy Canvas) */}
          <div className="landing-card-dark flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#090d16] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
            {/* Glow accent */}
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-blue-300">
                Prémium előkészítés
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold !text-white text-white tracking-tight">
                {copy.plus}
              </h3>
              <p className="mt-4 text-base text-slate-300 leading-relaxed">{copy.plusText}</p>

              <ul className="mt-8 space-y-3.5">
                {copy.plusItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium text-slate-200">
                    <Check size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Admin Activation Disclosure Box */}
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 text-xs font-medium leading-relaxed text-slate-300">
                <div className="font-bold text-white mb-1">Aktiválási feltétel</div>
                {copy.activation}
              </div>
            </div>

            <div className="relative z-10 mt-10 border-t border-slate-800/80 pt-6">
              {hasProfile ? (
                <Link to="/app/plus" className="landing-cta bg-blue-600 hover:bg-blue-500 border-blue-500 text-white font-semibold w-full min-h-[50px]">
                  {copy.plusAction}
                </Link>
              ) : (
                <Link to="/register" className="landing-cta bg-blue-600 hover:bg-blue-500 border-blue-500 text-white font-semibold w-full min-h-[50px]">
                  {copy.accountAction}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Loan Policy & Regulatory Disclaimer Notice */}
        <div className="mt-12 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-start gap-3.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
            <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p className="font-medium text-slate-800">{copy.loanPolicy}</p>
              <p className="mt-2 text-xs text-slate-500 font-medium">{disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
