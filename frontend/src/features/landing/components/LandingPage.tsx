import { Navigate } from "react-router";
import { useCurrentUser } from "@/features/authentication/hooks/useAuth";
import { homePathFor } from "@/features/authentication/lib/homePath";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { ComparisonSection } from "./ComparisonSection";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { PriceTeaser } from "./PriceTeaser";
import { Sources } from "./Sources";
import { TrustStrip } from "./TrustStrip";
import "../i18n";

/**
 * The public front door: the pitch, a worked example, and two ways in — the
 * free assessment or a company account. A signed-in visitor with a profile
 * has no use for it and is sent straight to their matches; an anonymous one
 * who already built a profile gets an "open the app" link instead (see
 * `LandingHeader`), so they are never trapped away from it.
 *
 * A thin shell on purpose: every section below is its own component, so the
 * page itself is just the redirect guard and the order they appear in.
 */
export function LandingPage() {
  const user = useCurrentUser();
  const { profile } = useCompanyProfile();

  // An administrator has no use for a company profile, so they go straight to the console.
  if (user && (user.role === "admin" || profile)) return <Navigate to={homePathFor(user)} replace />;

  return (
    <div className="min-h-screen bg-paper">
      <LandingHeader />
      <Hero />
      <TrustStrip />
      <main>
        <ComparisonSection />
        <HowItWorks />
        <Sources />
        <PriceTeaser />
      </main>
      <LandingFooter />
    </div>
  );
}
