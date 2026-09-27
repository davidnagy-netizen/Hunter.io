import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import comparisonBlueprints from '@/features/landing/assets/comparison-blueprints.jpg';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Answers essential procedural questions on tax lookups, funding categories, and data safety.
 * Native accessible disclosure elements paired with authentic planning blueprints and readiness criteria.
 */
export function FaqSection({ copy }: { copy: LandingCopy['faq'] }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section className="border-t border-[#E6E4DF] bg-[#FFFFFF] py-20 sm:py-28 lg:py-32">
      <div className="landing-wrap">
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold tracking-widest text-[#273F4F] uppercase mb-3 sm:mb-4 inline-block">
            {copy.title.includes('Kérdések') ? 'TUDNIVALÓK & GYAKORI KÉRDÉSEK' : 'FREQUENTLY ASKED QUESTIONS'}
          </span>
          <h2 className="text-[#161616] font-bold tracking-tight">{copy.title}</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Preview & Blueprint Column (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#F7F6F4] shadow-md border border-[#D9D8D5]">
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
                  className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-[#687984]"
                >
                  <span>{copy.imageError}</span>
                </div>
              )}
            </div>

            {copy.previewItems && (
              <div className="landing-card-elevated rounded-3xl border border-[#E6E4DF] bg-[#F7F6F4] p-6 sm:p-7 shadow-xs">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#273F4F]">
                  {copy.previewSubtitle}
                </div>
                <h3 className="text-lg font-bold text-[#161616] mt-1.5">{copy.previewTitle}</h3>
                <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-[#273F4F] font-medium">
                  {copy.previewItems.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FE7743] shrink-0" aria-hidden="true" />
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
              <details
                key={item.question}
                className="group rounded-2xl border border-[#E6E4DF] bg-[#FFFFFF] p-6 transition-all hover:border-[#D9D8D5] hover:shadow-xs"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base sm:text-lg font-bold text-[#161616] focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[#FE7743]">
                  <span>{item.question}</span>
                  <ChevronDown
                    size={22}
                    className="shrink-0 text-[#273F4F] transition-transform duration-200 group-open:rotate-180 group-open:text-[#FE7743]"
                    aria-hidden="true"
                  />
                </summary>
                <div className="mt-4 border-t border-[#E6E4DF] pt-4 text-sm sm:text-base leading-relaxed text-[#273F4F]">
                  <p>{item.answer}</p>
                  {item.privacyLink && (
                    <div className="mt-4">
                      <a href={copy.privacyHref} className="landing-link text-xs font-bold underline">
                        {copy.privacy}
                      </a>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
