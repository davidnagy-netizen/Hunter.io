import { useCurrentUser } from "@/features/authentication/hooks/useAuth";
import { homePathFor } from "@/features/authentication/lib/homePath";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { Navigate } from "react-router";
import "../i18n";
import { ChapterSeam } from "./ChapterSeam";
import { ComparisonSection } from "./ComparisonSection";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { PriceTeaser } from "./PriceTeaser";
import { ProofStats } from "./ProofStats";
import { Sources } from "./Sources";
import { Statement } from "./Statement";
import { TrustStrip } from "./TrustStrip";

// The chapter colors `ChapterSeam` bridges between — kept as named
// constants rather than re-reading them from CSS, since a seam needs the
// exact resolved color on each side to interpolate between, not the
// Tailwind token name.
const COLOR_INK = "#0e1726";
const COLOR_INK_3 = "#1e3050";
const COLOR_PAPER = "#f5f7fa";

/**
 * The public front door: the pitch, a worked example, and two ways in — the
 * free assessment or a company account. A signed-in visitor with a profile
 * has no use for it and is sent straight to their matches; an anonymous one
 * who already built a profile gets an "open the app" link instead (see
 * `LandingHeader`), so they are never trapped away from it.
 *
 * A thin shell on purpose: every section below is its own component. What
 * lives here beyond the redirect guard is the page's three chapters — large
 * dark/light/dark fields, not a striped alternation of every section — each
 * a shared background the sections inside render onto rather than owning
 * their own. `Section`'s `tone` prop keeps a section's kicker/title/subtitle
 * colors matched to whichever chapter it's in.
 *
 * `LandingHeader` sits outside every chapter, not nested in the first one —
 * `position: sticky` only stays stuck for as long as its own parent is on
 * screen, so nesting it inside chapter one made it scroll away with that
 * chapter instead of staying pinned for the whole page.
 *
 * The root itself carries a flat dark background, not `bg-paper` — the
 * header is a normal child of this root, so whatever color the root paints
 * is what shows through the header before any scrolling happens (there's no
 * overlap/stacking trick that changes that). It's flat rather than the
 * hero's own diagonal gradient on purpose: a gradient sized to the *whole
 * page* would reach its final stop near the footer, not at the bottom of
 * chapter one, so chapter one keeps that gradient on its own div (sized to
 * its own height, ending at `--color-ink-3` exactly where it visually
 * ends) while the root underneath is just a plain fallback. The light
 * chapter (`<main>`) gets its own explicit light background to override
 * the dark root for its own span of the page, and the footer needs the
 * same override.
 *
 * `ChapterSeam` bridges each boundary with a scroll-scrubbed color wipe
 * instead of the hard cut those flat/gradient backgrounds would otherwise
 * produce — its `from`/`to` must match each neighbor's own resolved edge
 * color exactly (chapter one's gradient *ends* at ink-3, so that's the
 * color to hand the seam, not the root's own ink).
 */
export function LandingPage() {
  const user = useCurrentUser();
  const { profile } = useCompanyProfile();

  // An administrator has no use for a company profile, so they go straight to the console.
  if (user && (user.role === "admin" || profile))
    return <Navigate to={homePathFor(user)} replace />;

  return (
    <div className="min-h-screen bg-ink text-white">
      <LandingHeader />

      <div className="bg-gradient-to-br from-ink via-ink-2 to-ink-3">
        <Hero />
        <TrustStrip />
        <ProofStats />
      </div>

      <ChapterSeam from={COLOR_INK_3} to={COLOR_PAPER} />

      <main className="bg-paper text-text">
        <ComparisonSection />
        <Sources />
      </main>

      <ChapterSeam from={COLOR_PAPER} to={COLOR_INK} />

      <div className="bg-ink">
        <Statement />
        <HowItWorks />
        <PriceTeaser />
      </div>

      <ChapterSeam from={COLOR_INK} to={COLOR_PAPER} />

      <LandingFooter className="bg-paper text-muted" />
    </div>
  );
}
