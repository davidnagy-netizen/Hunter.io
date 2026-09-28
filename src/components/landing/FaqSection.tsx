import { useId, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import comparisonBlueprints from '@/features/landing/assets/comparison-blueprints.jpg';
import { usePrefersReducedMotion } from '@/composables/usePrefersReducedMotion';
import type { LandingCopy } from '../../data/landingContent';
import { gsap } from './lib/gsap';

type FaqQuestion = LandingCopy['faq']['questions'][number];

/**
 * A native `<details>` snaps open/closed with no way to hook a transition into that — the browser
 * toggles its layout in one frame. This swaps it for a button + height-animated panel that looks
 * and behaves the same (same `aria-expanded` contract) but eases the reveal instead of popping it.
 */
function FaqItem({ item, copy }: { item: FaqQuestion; copy: LandingCopy['faq'] }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!panel || !inner) return;

    if (reducedMotion) {
      panel.style.height = open ? 'auto' : '0px';
      panel.style.opacity = open ? '1' : '0';
      return;
    }

    // Measuring `inner`'s natural height works even while `panel` clips it to 0: `offsetHeight`
    // is intrinsic to the element, unaffected by an ancestor's `overflow`/`height`.
    const targetHeight = open ? inner.offsetHeight : 0;
    gsap.to(panel, {
      height: targetHeight,
      opacity: open ? 1 : 0,
      duration: 0.35,
      ease: 'power2.out',
      onComplete: () => {
        // Left at a fixed height, a later window resize or copy change couldn't grow the panel;
        // `auto` lets it reflow naturally once the opening animation itself no longer needs a
        // fixed pixel value to animate toward.
        if (open) panel.style.height = 'auto';
      },
    });
  }, [open, reducedMotion]);

  return (
    <div className="group rounded-2xl border border-brand-line bg-surface p-6 transition-all hover:border-brand-line-strong hover:shadow-xs">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[60px] w-full cursor-pointer list-none items-center justify-between gap-4 text-left text-base sm:text-lg font-bold text-brand-ink focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand-orange"
      >
        <span>{item.question}</span>
        <ChevronDown
          size={22}
          className={`shrink-0 text-brand-slate transition-transform duration-200 ${open ? 'rotate-180 text-brand-orange' : ''}`}
          aria-hidden="true"
        />
      </button>
      <div ref={panelRef} id={panelId} style={{ height: 0, opacity: 0, overflow: 'hidden' }}>
        <div ref={innerRef} className="mt-4 border-t border-brand-line pt-4 text-sm sm:text-base leading-relaxed text-brand-slate">
          <p>{item.answer}</p>
          {item.privacyLink && (
            <div className="mt-4">
              <a href={copy.privacyHref} className="landing-link text-xs font-bold underline">
                {copy.privacy}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Answers essential procedural questions on tax lookups, funding categories, and data safety.
 * Accessible disclosure panels paired with authentic planning blueprints and readiness criteria.
 */
export function FaqSection({ copy }: { copy: LandingCopy['faq'] }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section className="border-t border-brand-line bg-surface py-20 sm:py-28 lg:py-32">
      <div className="landing-wrap">
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold tracking-widest text-brand-slate uppercase mb-3 sm:mb-4 inline-block">
            {copy.title.includes('Kérdések') ? 'TUDNIVALÓK & GYAKORI KÉRDÉSEK' : 'FREQUENTLY ASKED QUESTIONS'}
          </span>
          <h2 className="text-brand-ink font-bold tracking-tight">{copy.title}</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Preview & Blueprint Column (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-brand-surface-muted shadow-md border border-brand-line-strong">
              {!imgFailed ? (
                <img
                  src={comparisonBlueprints}
                  alt={copy.alt}
                  loading="lazy"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover object-center transition-transform hover:scale-105 duration-300"
                />
              ) : (
                <div
                  role="img"
                  aria-label={copy.alt}
                  className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-brand-muted"
                >
                  <span>{copy.imageError}</span>
                </div>
              )}
            </div>

            {copy.previewItems && (
              <div className="landing-card-elevated rounded-3xl border border-brand-line bg-brand-surface-muted p-6 sm:p-7 shadow-xs">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-brand-slate">
                  {copy.previewSubtitle}
                </div>
                <h3 className="text-lg font-bold text-brand-ink mt-1.5">{copy.previewTitle}</h3>
                <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-brand-slate font-medium">
                  {copy.previewItems.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* FAQ Accordion Column (7 cols) */}
          <div className="space-y-4 lg:col-span-7">
            {copy.questions.map((item) => (
              <FaqItem key={item.question} item={item} copy={copy} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
