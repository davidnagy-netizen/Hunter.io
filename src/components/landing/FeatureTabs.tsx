import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatTaxNumber, isValidTaxNumber } from '@/lib/taxNumber';
import type { LandingCopy } from '../../data/landingContent';

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
    <section id="palyazatok" className="border-t border-slate-200/80 bg-white py-16 sm:py-24 lg:py-28">
      <div className="landing-wrap">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Narrative & Navigation (45%) */}
          <div className="lg:col-span-5">
            <span className="text-xs font-mono font-bold tracking-widest text-blue-700 uppercase mb-3 sm:mb-4 inline-block">
              {copy.eyebrow}
            </span>
            <h2 className="text-slate-950 font-bold tracking-tight">{copy.title}</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">{copy.intro}</p>

            {/* Interactive Tab List */}
            <div
              role="tablist"
              aria-label={copy.tablist}
              className="mt-8 flex flex-col gap-2 rounded-2xl bg-slate-50 p-2 border border-slate-200/80"
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
                        ? 'bg-white text-blue-700 shadow-sm border border-blue-200/60'
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-950'
                    }`}
                  >
                    <span>{copy.tabs[index]}</span>
                    <span
                      className={`h-2 w-2 rounded-full transition-colors ${
                        isSelected ? 'bg-blue-700' : 'bg-slate-300'
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
                className="landing-card-elevated rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">{copy.tabs[0]}</span>
                    <h3 className="mt-1 text-2xl font-bold text-slate-950">{copy.grants.title}</h3>
                  </div>
                  <div className="rounded-xl bg-blue-50/90 border border-blue-200/80 px-4 py-2 text-right">
                    <div className="text-xs font-semibold text-blue-800">{copy.grants.metric.label}</div>
                    <div className="text-base font-extrabold text-blue-950">{copy.grants.metric.value}</div>
                  </div>
                </div>

                <p className="mt-5 text-base leading-relaxed text-slate-600">{copy.grants.text}</p>

                {/* Own Contribution Ratio Illustration */}
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>Támogatási arány</span>
                    <span>50% támogatás / 50% saját erő</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex" aria-hidden="true">
                    <div className="h-full bg-blue-700 w-1/2" />
                    <div className="h-full bg-emerald-600 w-1/2" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Vissza nem térítendő forrás</span>
                    <span>Megvalósítási idő: {copy.grants.timeline}</span>
                  </div>
                </div>

                {/* Eligibility Criteria List */}
                <div className="mt-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">{copy.grants.previewTitle}</div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {copy.grants.fields.map((field) => (
                      <div key={field} className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-3.5 py-2.5 border border-slate-100 text-xs font-semibold text-slate-800">
                        <span className="h-2 w-2 rounded-full bg-blue-700 shrink-0" aria-hidden="true" />
                        <span>{field}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
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
                className="landing-card-elevated rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">{copy.tabs[1]}</span>
                    <h3 className="mt-1 text-2xl font-bold text-slate-950">{copy.loans.title}</h3>
                  </div>
                  <div className="rounded-xl bg-amber-50/90 border border-amber-200/80 px-4 py-2 text-right">
                    <div className="text-xs font-semibold text-amber-800">{copy.loans.metric.label}</div>
                    <div className="text-base font-extrabold text-amber-950">{copy.loans.metric.value}</div>
                  </div>
                </div>

                <p className="mt-5 text-base leading-relaxed text-slate-600">{copy.loans.text}</p>

                {/* Principal vs Interest Subsidy Comparison */}
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">{copy.loans.previewTitle}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {copy.loans.fields.map((field) => (
                      <div key={field} className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 border border-slate-200 text-xs font-semibold text-slate-800">
                        <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" aria-hidden="true" />
                        <span>{field}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unpaywalled Regulatory Warning Box */}
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-medium text-amber-950 leading-relaxed">
                  <div className="font-bold text-amber-900 mb-1">MNB jogi állásfoglalásig érvényes korlátozás</div>
                  {copy.loans.gate}
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
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
                className="landing-card-elevated rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">{copy.tabs[2]}</span>
                    <h3 className="mt-1 text-2xl font-bold text-slate-950">{copy.nav.title}</h3>
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-blue-50/90 border border-blue-200/80 px-3 py-1.5 text-xs font-bold text-blue-700">
                    {copy.nav.local}
                  </span>
                </div>

                <p className="mt-5 text-base leading-relaxed text-slate-600">{copy.nav.text}</p>

                {/* Local CDV Verification Form */}
                <form onSubmit={handleTaxSubmit} className="mt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor={inputId} className="text-sm font-bold text-slate-900">
                        {copy.nav.taxLabel}
                      </label>
                      <button
                        type="button"
                        onClick={handleLoadSample}
                        className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline"
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
                    <div id={feedbackId} className="mt-1.5 text-xs text-slate-500">
                      {copy.nav.helper}
                    </div>
                  </div>

                  <button type="submit" className="landing-cta w-full">
                    {copy.nav.submit}
                  </button>

                  <div role="status" aria-live="polite" className="min-h-[2.5rem]">
                    {validated && isTaxEmpty && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
                        <span>{copy.nav.required}</span>
                      </div>
                    )}
                    {validated && !isTaxEmpty && !isTaxValid && (
                      <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-700" aria-hidden="true" />
                        <span>{copy.nav.invalid}</span>
                      </div>
                    )}
                    {validated && isTaxValid && (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
                        <span>{copy.nav.valid}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <label className="text-xs font-bold text-slate-700">{copy.nav.companyLabel}</label>
                    {companyName ? (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3.5">
                        <div className="text-sm font-bold text-slate-900">{companyName}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{copy.nav.sampleNote}</div>
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-3.5 text-xs text-slate-500">
                        {copy.nav.companyEmpty}
                      </div>
                    )}
                  </div>
                </form>

                <div className="mt-8 border-t border-slate-100 pt-6">
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
