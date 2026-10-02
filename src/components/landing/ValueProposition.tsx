import { Scale, Check, AlertCircle, Search, GitCompareArrows, Sparkles } from 'lucide-react';
import type { LandingCopy } from '../../data/landingContent';
import { AnimatedProgressBar } from './AnimatedProgressBar';

/**
 * Details algorithmic scoring criteria, TEÁOR classification, and explicit grant-versus-loan separation.
 * Asymmetric editorial storytelling with interactive product mockups and unpaywalled regulatory disclosures.
 */
const STEP_ICONS = [Search, GitCompareArrows, Sparkles];

export function ValueProposition({ copy }: { copy: LandingCopy['value'] }) {
  const itemScore = copy.items[0];
  const itemTeaor = copy.items[1];
  const itemLoan = copy.items[2];

  const { score, teaor, loan } = copy;
  const rowMeta = [
    { weight: 40, match: 95, bar: 'bg-brand-orange' },
    { weight: 30, match: 85, bar: 'bg-brand-slate' },
    { weight: 30, match: 80, bar: 'bg-brand-slate' },
  ];

  return (
    <section id="rolunk" className="border-t border-brand-line bg-brand-cream py-16 sm:py-24 lg:py-28">
      <div className="landing-wrap">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold tracking-widest text-brand-slate uppercase mb-3 inline-block">
            {copy.eyebrow}
          </span>
          <h2 className="text-brand-ink font-bold tracking-tight">{copy.title}</h2>
          <p className="mt-4 text-base sm:text-lg text-brand-slate leading-relaxed">{copy.intro}</p>
          <ol className="mt-6 flex flex-wrap gap-3">
            {copy.steps.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={step} className="inline-flex items-center gap-2 rounded-full border border-brand-line-strong bg-surface px-4 py-2 text-sm font-bold text-brand-ink">
                  <Icon size={16} className="text-brand-orange-deep" aria-hidden="true" />
                  {step}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Feature 1: Algorithmic Fundor Score (45% narrative / 55% substantial product visual) */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Narrative (45%) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <h3 className="landing-feature-heading text-brand-ink font-bold">
              {itemScore.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-brand-slate leading-relaxed">
              {itemScore.text}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 w-full">
              {itemScore.attributes.map((attr) => (
                <div
                  key={attr.label}
                  className="flex items-center justify-between rounded-xl bg-surface border border-brand-line-strong px-4 py-2.5 text-xs sm:text-sm"
                >
                  <span className="font-semibold text-brand-muted">{attr.label}</span>
                  <span className="font-bold text-brand-ink">{attr.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs sm:text-sm text-brand-muted leading-relaxed">
              {score.para}
            </p>
          </div>

          {/* Right Product Mockup (55%) */}
          <div className="lg:col-span-7">
            <div className="landing-card-elevated rounded-3xl border border-brand-line-strong bg-surface p-6 sm:p-8 shadow-lg">
              <div className="flex items-center justify-between border-b border-brand-line pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-orange inline-block" aria-hidden="true" />
                  <span className="text-xs font-mono font-bold text-brand-slate uppercase tracking-wider">
                    {score.widgetTitle}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-slate px-3 py-1 text-xs font-bold text-brand-cream">
                  <Check size={13} className="text-brand-orange" aria-hidden="true" />
                  <span>{score.badge}</span>
                </span>
              </div>
              {/* Large Score Benchmark */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-brand-ink tracking-tight">
                    87 <span className="text-xl sm:text-2xl font-bold text-brand-muted">/ 100</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-brand-muted">
                  {score.reference}
                </div>
              </div>

              {/* Readiness Secondary Progress */}
              <div className="mt-6 rounded-2xl bg-brand-surface-muted border border-brand-line p-4">
                <div className="flex items-center justify-between text-xs font-bold text-brand-slate mb-2">
                  <span>{score.readiness}</span>
                  <span className="font-mono text-brand-ink">92%</span>
                </div>
                <AnimatedProgressBar
                  value={92}
                  className="h-2.5 w-full rounded-full bg-brand-line overflow-hidden"
                  fillClassName="bg-brand-orange"
                  ariaLabel={score.readinessAria}
                />
              </div>

              {/* Criteria Weighting Breakdown */}
              <div className="mt-6 space-y-3.5">
                {score.rows.map((row, i) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs font-semibold text-brand-slate mb-1">
                      <span title={row.hint}>{row.label}</span>
                      <span className="font-mono text-brand-muted">
                        {score.weight}: {rowMeta[i].weight}% · {score.match}: {rowMeta[i].match}%
                      </span>
                    </div>
                    <AnimatedProgressBar
                      value={rowMeta[i].match}
                      className="h-2 w-full rounded-full bg-brand-surface-muted overflow-hidden"
                      fillClassName={rowMeta[i].bar}
                      ariaLabel={row.aria}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: TEÁOR’25 Sector Classification (55% visual / 45% narrative - REVERSED) */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Product Visual (55%) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="landing-card-elevated rounded-3xl border border-brand-line-strong bg-surface p-6 sm:p-8 shadow-lg">
              <div className="flex items-center justify-between border-b border-brand-line pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-orange inline-block" aria-hidden="true" />
                  <span className="text-xs font-mono font-bold text-brand-slate uppercase tracking-wider">
                    {teaor.widgetTitle}
                  </span>
                </div>
              </div>

              {/* Simulation rows */}
              <div className="mt-6 space-y-4">
                {/* Row 1: Valid primary activity */}
                <div className="rounded-2xl border border-brand-orange bg-brand-orange-bg p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-brand-slate px-2.5 py-1 text-xs font-mono font-bold text-brand-cream border border-brand-slate-2 shrink-0">
                        6201
                      </div>
                      <div>
                        <div className="text-sm font-bold text-brand-ink">
                          {teaor.row1Title}
                        </div>
                        <div className="text-xs text-brand-muted mt-0.5">
                          {teaor.row1Sub}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-3 py-1 text-xs font-bold text-brand-cream self-start sm:self-center">
                      <Check size={13} className="text-brand-orange" aria-hidden="true" />
                      <span>{teaor.row1Badge}</span>
                    </span>
                  </div>
                </div>

                {/* Row 2: Condition-bound activity */}
                <div className="rounded-2xl border border-brand-line-strong bg-brand-surface-muted p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-brand-slate px-2.5 py-1 text-xs font-mono font-bold text-brand-cream border border-brand-slate-2 shrink-0">
                        4120
                      </div>
                      <div>
                        <div className="text-sm font-bold text-brand-ink">
                          {teaor.row2Title}
                        </div>
                        <div className="text-xs text-brand-muted mt-0.5">
                          {teaor.row2Sub}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-cream border border-brand-line-strong px-3 py-1 text-xs font-bold text-brand-slate self-start sm:self-center">
                      <AlertCircle size={13} className="text-brand-orange" aria-hidden="true" />
                      <span>{teaor.row2Badge}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and conversion badge */}
              <div className="mt-5 pt-4 border-t border-brand-line text-xs text-brand-slate">
                <span className="font-medium">{teaor.footer}</span>
              </div>
            </div>
          </div>

          {/* Right Narrative (45%) */}
          <div className="lg:col-span-5 flex flex-col items-start order-1 lg:order-2">
            <h3 className="landing-feature-heading text-brand-ink font-bold">
              {itemTeaor.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-brand-slate leading-relaxed">
              {itemTeaor.text}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 w-full">
              {itemTeaor.attributes.map((attr) => (
                <div
                  key={attr.label}
                  className="flex items-center justify-between rounded-xl bg-surface border border-brand-line-strong px-4 py-2.5 text-xs sm:text-sm"
                >
                  <span className="font-semibold text-brand-muted">{attr.label}</span>
                  <span className="font-bold text-brand-ink">{attr.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs sm:text-sm text-brand-muted leading-relaxed">
              {teaor.para}
            </p>
          </div>
        </div>

        {/* Feature 3: Non-Repayable Grant vs. Debt Instrument Separation (id="hitelek" full-width editorial block) */}
        <div id="hitelek" className="mt-16 sm:mt-24 rounded-3xl border border-brand-line-strong bg-surface p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-lg bg-brand-cream border border-brand-line-strong px-3 py-1 text-xs font-bold text-brand-slate mb-4">
              <Scale size={15} aria-hidden="true" />
              <span>{loan.pill}</span>
            </div>
            <h3 className="landing-feature-heading text-brand-ink font-bold">
              {itemLoan.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-brand-slate leading-relaxed">
              {itemLoan.text}
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-brand-line">
                  <td className="w-1/4" />
                  <th scope="col" className="py-3.5 px-4 font-bold text-brand-ink bg-brand-surface-muted rounded-t-xl w-3/8">
                    {loan.grantHead}
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-brand-ink bg-brand-orange-bg rounded-t-xl w-3/8">
                    {loan.loanHead}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                {loan.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="py-3.5 pr-4 text-left font-bold text-brand-ink">{row.label}</th>
                    <td className="py-3.5 px-4 bg-brand-surface-muted/50 text-brand-slate">{row.grant}</td>
                    <td className="py-3.5 px-4 bg-brand-orange-bg/50 text-brand-slate">{row.loan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-brand-muted">{loan.note}</p>

          {/* Prominent Unpaywalled Kavosz Gate Box */}
          <div className="mt-8 rounded-2xl border border-brand-line-strong bg-slate-50 p-5 sm:p-6 text-xs sm:text-sm font-semibold leading-relaxed text-brand-ink">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-brand-orange-deep shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-bold block mb-1 text-brand-ink">{loan.gateTitle}</span>
                <span className="text-brand-slate">{copy.gate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
