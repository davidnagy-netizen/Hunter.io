import type { LandingCopy } from "../../data/landingContent";

/**
 * The hero's right-side visual: the matches-app phone mockup, ported 1:1 (markup, icons and
 * styling) from the standalone design at `fundor_lottie/index_3.html`, including its floating
 * badge motion (`landing-hero-float` in landing.css). That reference also offered a Lottie
 * animation as an enhancement over this same markup — dropped here: the exported JSON is a
 * simplified vector re-draw that loses detail against the real markup, has no floating motion
 * of its own, and bakes its labels in English regardless of site language. This is the one true
 * visual now, not a fallback.
 */
export function HeroVisual({ copy }: { copy: LandingCopy["hero"]["visual"] }) {
  return (
    <div className="landing-hero-visual">
      <div className="landing-hero-phone">
        <div className="landing-hero-phone-frame">
          <div className="landing-hero-phone-screen">
            <div className="landing-hero-island" />
            <div className="landing-hero-status">
              <span>9:41</span>
              <span className="sig">
                <svg viewBox="0 0 20 14" fill="currentColor" width="17" height="12" aria-hidden="true">
                  <rect x="0" y="9" width="3" height="5" rx="1" />
                  <rect x="5" y="6" width="3" height="8" rx="1" />
                  <rect x="10" y="3" width="3" height="11" rx="1" />
                  <rect x="15" y="0" width="3" height="14" rx="1" />
                </svg>
                <svg viewBox="0 0 20 15" fill="none" stroke="currentColor" strokeWidth="1.6" width="17" height="13" aria-hidden="true">
                  <path d="M2 5.5a12 12 0 0116 0M5 9a7 7 0 0110 0" />
                  <circle cx="10" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
                </svg>
                <svg viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="22" height="12" aria-hidden="true">
                  <rect x="1" y="2" width="20" height="10" rx="3" />
                  <rect x="3" y="4" width="14" height="6" rx="1.5" fill="currentColor" stroke="none" />
                  <path d="M23.5 5v4" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            <div className="landing-hero-app-head">
              <span className="t">{copy.matchesLabel}</span>
              <span className="pill">{copy.matchesCount}</span>
            </div>

            <div className="landing-hero-app-body">
              <div className="landing-hero-match-card">
                <div className="landing-hero-mc-top">
                  <div>
                    <div className="landing-hero-mc-tag">{copy.topTag}</div>
                    <div className="landing-hero-mc-title">{copy.topTitle}</div>
                    <div className="landing-hero-mc-amount">{copy.topAmount}</div>
                  </div>
                  <div className="landing-hero-mc-ring">
                    <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
                      <circle cx="29" cy="29" r="24" fill="none" stroke="var(--color-brand-cream)" strokeWidth="6" />
                      <circle
                        cx="29" cy="29" r="24" fill="none" stroke="var(--color-brand-orange)" strokeWidth="6"
                        strokeLinecap="round" strokeDasharray="150.8" strokeDashoffset="19.6"
                      />
                    </svg>
                    <div className="n">{copy.topScore}</div>
                  </div>
                </div>
                <span className="landing-hero-mc-band">{copy.topBand}</span>
                <div className="landing-hero-mc-factors">
                  <div className="landing-hero-mc-factor">
                    <div className="fr"><span>{copy.factor1Label}</span><span>{copy.factor1Value}</span></div>
                    <div className="landing-hero-mc-bar"><i style={{ width: copy.factor1Value }} /></div>
                  </div>
                  <div className="landing-hero-mc-factor">
                    <div className="fr"><span>{copy.factor2Label}</span><span>{copy.factor2Value}</span></div>
                    <div className="landing-hero-mc-bar"><i style={{ width: copy.factor2Value }} /></div>
                  </div>
                </div>
              </div>

              <div className="landing-hero-more-label">{copy.moreLabel}</div>

              <div className="landing-hero-match-row">
                <div className="mr-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                  </svg>
                </div>
                <div className="mr-t"><b>{copy.match2Title}</b><span>{copy.match2Amount}</span></div>
                <div className="mr-score">{copy.match2Score}</div>
              </div>
              <div className="landing-hero-match-row">
                <div className="mr-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0012 2z" />
                  </svg>
                </div>
                <div className="mr-t"><b>{copy.match3Title}</b><span>{copy.match3Amount}</span></div>
                <div className="mr-score">{copy.match3Score}</div>
              </div>
            </div>

            <div className="landing-hero-app-tabs">
              <div className="landing-hero-app-tab active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                {copy.tabMatches}
              </div>
              <div className="landing-hero-app-tab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {copy.tabCalendar}
              </div>
              <div className="landing-hero-app-tab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                {copy.tabDocuments}
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero-float hf-1">
          <div className="ic" style={{ background: "var(--color-brand-green-bg)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-green)" strokeWidth="2.2" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>{copy.float1Title}<small>{copy.float1Sub}</small></div>
        </div>
        <div className="landing-hero-float hf-2">
          <div className="ic" style={{ background: "var(--color-brand-orange-bg)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-orange-deep)" strokeWidth="2" aria-hidden="true">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <div>{copy.float2Title}{copy.float2Sub && <small>{copy.float2Sub}</small>}</div>
        </div>
        <div className="landing-hero-float hf-3">
          <div className="ic" style={{ background: "var(--color-brand-orange-bg)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-orange-deep)" strokeWidth="2" aria-hidden="true">
              <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
            </svg>
          </div>
          <div>{copy.float3Title}<small>{copy.float3Sub}</small></div>
        </div>
      </div>
    </div>
  );
}
