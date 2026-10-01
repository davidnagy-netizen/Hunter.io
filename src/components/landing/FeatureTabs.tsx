import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatTaxNumber, isValidTaxNumber } from '@/lib/taxNumber';
import type { LandingCopy } from '../../data/landingContent';
import { AnimatedSplitBar } from './AnimatedProgressBar';

type TabId = 'grants' | 'loans' | 'nav';

/**
 * Organises funding instruments into accessible tabs with a local-only tax verification sandbox.
 * Replaces speculative credit suggestions and automated lookups with explicit instrument boundaries and offline CDV feedback.
 */
export function FeatureTabs({ copy }: { copy: LandingCopy['features'] }) {
  const [activeTab, setActiveTab] = useState<TabId>('grants');
  const tabIds: TabId[] = ['grants', 'loans', 'nav'];
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ grants: null, loans: null, nav: null });

  // NAV local demonstration state
  const [taxInput, setTaxInput] = useState('');
  const [validated, setValidated] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const inputId = useId();
  const feedbackId = useId();

  const isTaxValid = isValidTaxNumber(taxInput);
  const isTaxEmpty = taxInput.trim().length === 0;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % tabIds.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + tabIds.length) % tabIds.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabIds.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = tabIds[nextIndex];
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };
  const handleTaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);
  };

  const handleLoadSample = () => {
    setTaxInput(copy.nav.sampleNumber);
    setCompanyName(copy.nav.sampleName);
    setValidated(true);
  };

  return (
    <section id="palyazatok" className="border-t border-brand-line bg-surface py-16 sm:py-24 lg:py-28">
      <div className="landing-wrap">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Narrative & Navigation (45%) */}
          <div className="lg:col-span-5">
            <span className="text-xs font-mono font-bold tracking-widest text-brand-slate uppercase mb-3 sm:mb-4 inline-block">
              {copy.eyebrow}
            </span>
            <h2 className="text-brand-ink font-bold tracking-tight">{copy.title}</h2>
            <p className="mt-4 text-base sm:text-lg text-brand-slate leading-relaxed">{copy.intro}</p>

            {/* Interactive Tab List */}
            <div
              role="tablist"
              aria-label={copy.tablist}
              className="mt-8 flex flex-col gap-2 rounded-2xl bg-brand-surface-muted p-2 border border-brand-line"
            >
              {tabIds.map((id, index) => {
                const isSelected = activeTab === id;
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      tabRefs.current[id] = el;
                    }}
                    role="tab"
                    id={`tab-${id}`}
                    aria-selected={isSelected}
                    aria-controls={`panel-${id}`}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setActiveTab(id)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm sm:text-[15px] font-semibold transition-all focus-visible:rounded-lg ${
                      isSelected
                        ? 'bg-brand-slate text-brand-cream shadow-sm'
                        : 'text-brand-slate hover:bg-surface hover:text-brand-ink'
                    }`}
                  >
                    <span>{copy.tabs[index]}</span>
                    <span
                      className={`h-2 w-2 rounded-full transition-colors ${
                        isSelected ? 'bg-brand-orange' : 'bg-brand-line-strong'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>
          {/* Right Column: Substantial Product Showcase Panel (55%) */}
          <div className="lg:col-span-7">
            {activeTab === 'grants' && (
              <div
                role="tabpanel"
                id="panel-grants"
                aria-labelledby="tab-grants"
                className="landing-card-elevated rounded-3xl border border-brand-line-strong bg-surface p-6 sm:p-10 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-line pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-slate">{copy.tabs[0]}</span>
                    <h3 className="mt-1 text-2xl font-bold text-brand-ink">{copy.grants.title}</h3>
                  </div>
                  <div className="rounded-xl bg-brand-orange-bg border border-brand-orange px-4 py-2 text-right">
                    <div className="text-xs font-semibold text-brand-slate">{copy.grants.metric.label}</div>
                    <div className="text-base font-extrabold text-brand-ink">{copy.grants.metric.value}</div>
                  </div>
                </div>

                <p className="mt-5 text-base leading-relaxed text-brand-slate">{copy.grants.text}</p>

                {/* Own Contribution Ratio Illustration */}
                <div className="mt-6 rounded-2xl bg-brand-surface-muted p-4 border border-brand-line">
                  <div className="flex items-center justify-between text-xs font-semibold text-brand-ink mb-2">
                    <span>{copy.grants.ratioLabel}</span>
                    <span>{copy.grants.ratio}</span>
                  </div>
                  <AnimatedSplitBar
                    className="h-3 w-full rounded-full bg-brand-line overflow-hidden flex"
                    segments={[
                      { value: 50, className: 'bg-brand-orange' },
                      { value: 50, className: 'bg-brand-slate' },
                    ]}
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-brand-muted">
                    <span>{copy.grants.noRepay}</span>
                    <span>{copy.grants.timelineLabel}: {copy.grants.timeline}</span>
                  </div>
                </div>

                {/* Eligibility Criteria List */}
                <div className="mt-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-slate">{copy.grants.previewTitle}</div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {copy.grants.fields.map((field) => (
                      <div key={field} className="flex items-center gap-2 rounded-xl bg-brand-surface-muted px-3.5 py-2.5 border border-brand-line text-xs font-semibold text-brand-ink">
                        <span className="h-2 w-2 rounded-full bg-brand-orange shrink-0" aria-hidden="true" />
                        <span>{field}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-brand-line pt-6">
                  <Link to="/assess" className="landing-cta">
                    {copy.grants.action}
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'loans' && (
              <div
                role="tabpanel"
                id="panel-loans"
                aria-labelledby="tab-loans"
                className="landing-card-elevated rounded-3xl border border-brand-line-strong bg-surface p-6 sm:p-10 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-line pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-slate">{copy.tabs[1]}</span>
                    <h3 className="mt-1 text-2xl font-bold text-brand-ink">{copy.loans.title}</h3>
                  </div>
                  <div className="rounded-xl bg-brand-cream border border-brand-line-strong px-4 py-2 text-right">
                    <div className="text-xs font-semibold text-brand-slate">{copy.loans.metric.label}</div>
                    <div className="text-base font-extrabold text-brand-ink">{copy.loans.metric.value}</div>
                  </div>
                </div>

                <p className="mt-5 text-base leading-relaxed text-brand-slate">{copy.loans.text}</p>

                {/* Principal vs Interest Subsidy Comparison */}
                <div className="mt-6 rounded-2xl bg-brand-surface-muted p-4 border border-brand-line">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-slate mb-3">{copy.loans.previewTitle}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {copy.loans.fields.map((field) => (
                      <div key={field} className="flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5 border border-brand-line-strong text-xs font-semibold text-brand-ink">
                        <span className="h-2 w-2 rounded-full bg-brand-slate shrink-0" aria-hidden="true" />
                        <span>{field}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unpaywalled Regulatory Warning Box */}
                <div className="mt-6 rounded-2xl border border-brand-line-strong bg-brand-cream p-4 text-xs font-medium text-brand-slate leading-relaxed">
                  <div className="font-bold text-brand-ink mb-1">{copy.loans.gateTitle}</div>
                  {copy.loans.gate}
                </div>

                <div className="mt-8 border-t border-brand-line pt-6">
                  <a href="#hitelek" className="landing-cta landing-cta-secondary">
                    {copy.loans.action}
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'nav' && (
              <div
                role="tabpanel"
                id="panel-nav"
                aria-labelledby="tab-nav"
                className="landing-card-elevated rounded-3xl border border-brand-line-strong bg-surface p-6 sm:p-10 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-line pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-slate">{copy.tabs[2]}</span>
                    <h3 className="mt-1 text-2xl font-bold text-brand-ink">{copy.nav.title}</h3>
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-brand-orange-bg border border-brand-orange px-3 py-1.5 text-xs font-bold text-brand-ink">
                    {copy.nav.local}
                  </span>
                </div>

                <p className="mt-5 text-base leading-relaxed text-brand-slate">{copy.nav.text}</p>

                {/* Local CDV Verification Form */}
                <form onSubmit={handleTaxSubmit} className="mt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor={inputId} className="text-sm font-bold text-brand-ink">
                        {copy.nav.taxLabel}
                      </label>
                      <button
                        type="button"
                        onClick={handleLoadSample}
                        className="text-xs font-bold text-brand-slate hover:text-brand-orange hover:underline"
                      >
                        {copy.nav.sample}
                      </button>
                    </div>
                    <input
                      id={inputId}
                      type="text"
                      inputMode="numeric"
                      value={taxInput}
                      onChange={(e) => {
                        setTaxInput(formatTaxNumber(e.target.value));
                        setCompanyName(null);
                      }}
                      onBlur={() => setValidated(true)}
                      aria-describedby={feedbackId}
                      aria-invalid={validated && (!isTaxValid || isTaxEmpty)}
                      placeholder="12345678-1-23"
                      className="mt-1.5"
                    />
                    <div id={feedbackId} className="mt-1.5 text-xs text-brand-muted">
                      {copy.nav.helper}
                    </div>
                  </div>

                  <button type="submit" className="landing-cta w-full">
                    {copy.nav.submit}
                  </button>

                  <div role="status" aria-live="polite" className="min-h-[2.5rem]">
                    {validated && isTaxEmpty && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber bg-amber-bg p-3 text-xs text-amber">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber" aria-hidden="true" />
                        <span>{copy.nav.required}</span>
                      </div>
                    )}
                    {validated && !isTaxEmpty && !isTaxValid && (
                      <div className="flex items-start gap-2 rounded-xl border border-red bg-red-bg p-3 text-xs text-red">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red" aria-hidden="true" />
                        <span>{copy.nav.invalid}</span>
                      </div>
                    )}
                    {validated && isTaxValid && (
                      <div className="flex items-start gap-2 rounded-xl border border-brand-orange bg-brand-orange-bg p-3 text-xs text-brand-ink font-medium">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-slate" aria-hidden="true" />
                        <span>{copy.nav.valid}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-brand-surface-muted p-4 border border-brand-line">
                    <label className="text-xs font-bold text-brand-slate">{copy.nav.companyLabel}</label>
                    {companyName ? (
                      <div className="mt-2 rounded-xl border border-brand-line-strong bg-surface p-3.5">
                        <div className="text-sm font-bold text-brand-ink">{companyName}</div>
                        <div className="mt-0.5 text-xs text-brand-muted">{copy.nav.sampleNote}</div>
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl border border-dashed border-brand-line-strong p-3.5 text-xs text-brand-muted">
                        {copy.nav.companyEmpty}
                      </div>
                    )}
                  </div>
                </form>

                <div className="mt-8 border-t border-brand-line pt-6">
                  <Link to="/register" className="landing-link font-semibold">
                    {copy.nav.action}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
