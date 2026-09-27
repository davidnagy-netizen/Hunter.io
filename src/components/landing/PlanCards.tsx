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
    <section id="fundor-plus" className="bg-[#FFFFFF] py-12 sm:py-16 lg:py-20 border-t border-[#E6E4DF]">
      <div className="landing-canvas landing-canvas-plans relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-[#EFEEEA] border border-[#D9D8D5] p-8 sm:p-12 lg:p-16 shadow-sm">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#161616] px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#EFEEEA] mb-3 sm:mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FE7743]" aria-hidden="true" />
            <span>{copy.title.includes('Előszűrés') ? 'FELKÉSZÜLÉSI SZINTEK' : 'PREPARATION PATHWAYS'}</span>
          </span>
          <h2 className="text-[#161616] font-bold tracking-tight">{copy.title}</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
          {/* Left Pathway: Free Basic Tier */}
          <div className="landing-card-elevated flex flex-col justify-between rounded-3xl border border-[#D9D8D5] bg-[#FFFFFF] p-8 sm:p-10 shadow-md">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#687984]">
                Alap szint
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-[#161616] tracking-tight">
                {copy.free}
              </h3>
              <p className="mt-4 text-base text-[#273F4F] leading-relaxed">{copy.freeText}</p>

              <ul className="mt-8 space-y-3.5">
                {copy.freeItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium text-[#273F4F]">
                    <Check size={18} className="mt-0.5 shrink-0 text-[#273F4F]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col gap-3.5 border-t border-[#E6E4DF] pt-6">
              <Link to="/assess" className="landing-cta landing-cta-secondary w-full font-semibold min-h-[50px]">
                {copy.freeAction}
              </Link>
              <Link to="/register" className="landing-link justify-center text-center text-xs font-semibold">
                {copy.accountAction}
              </Link>
            </div>
          </div>

          {/* Right Pathway: Fundor Plus Tier (Deep Black Canvas) */}
          <div className="landing-card-dark flex flex-col justify-between rounded-3xl border border-[#273F4F] bg-[#161616] p-8 sm:p-10 text-[#EFEEEA] shadow-2xl relative overflow-hidden">
            {/* Glow accent */}
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#FE7743]/15 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full bg-[#273F4F] border border-[#687984] px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[#EFEEEA]">
                Prémium előkészítés
              </div>
              <h3 className="mt-3 text-2xl sm:text-3xl font-bold !text-[#EFEEEA] text-[#EFEEEA] tracking-tight">
                {copy.plus}
              </h3>
              <p className="mt-4 text-base text-[#D4D9DC] leading-relaxed">{copy.plusText}</p>
              <ul className="mt-8 space-y-3.5">
                {copy.plusItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium text-[#EFEEEA]">
                    <Check size={18} className="mt-0.5 shrink-0 text-[#FE7743]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Admin Activation Disclosure Box */}
              <div className="mt-8 rounded-2xl border border-[#687984] bg-[#273F4F]/80 p-4 sm:p-5 text-xs font-medium leading-relaxed text-[#BEC5CA]">
                <div className="font-bold text-[#EFEEEA] mb-1">Aktiválási feltétel</div>
                {copy.activation}
              </div>
            </div>

            <div className="relative z-10 mt-10 border-t border-[#273F4F] pt-6">
              {hasProfile ? (
                <Link to="/app/plus" className="landing-cta w-full min-h-[50px]">
                  {copy.plusAction}
                </Link>
              ) : (
                <Link to="/register" className="landing-cta w-full min-h-[50px]">
                  {copy.accountAction}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Loan Policy & Regulatory Disclaimer Notice */}
        <div className="mt-12 rounded-3xl border border-[#D9D8D5] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs">
          <div className="flex items-start gap-3.5 text-xs leading-relaxed text-[#687984] sm:text-sm">
            <ShieldAlert size={20} className="mt-0.5 shrink-0 text-[#273F4F]" aria-hidden="true" />
            <div>
              <p className="font-medium text-[#161616]">{copy.loanPolicy}</p>
              <p className="mt-2 text-xs text-[#687984] font-medium">{disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
