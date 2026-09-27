import { Navigate } from 'react-router';
import { useCurrentUser } from '@/features/authentication/hooks/useAuth';
import { homePathFor } from '@/features/authentication/lib/homePath';
import { useCompanyProfile } from '@/features/profile/hooks/useCompanyProfile';
import { useUiStore } from '@/store/uiStore';
import { landingContent } from '../../../../src/data/landingContent';
import { LandingNavbar } from '../../../../src/components/landing/LandingNavbar';
import { HeroSection } from '../../../../src/components/landing/HeroSection';
import { FeatureTabs } from '../../../../src/components/landing/FeatureTabs';
import { StatCounter } from '../../../../src/components/landing/StatCounter';
import { EntrepreneurBanner } from '../../../../src/components/landing/EntrepreneurBanner';
import { ValueProposition } from '../../../../src/components/landing/ValueProposition';
import { QuickActionBar } from '../../../../src/components/landing/QuickActionBar';
import { UseCases } from '../../../../src/components/landing/UseCases';
import { EditorialJourney } from '../../../../src/components/landing/EditorialJourney';
import { CaseStudyCarousel } from '../../../../src/components/landing/CaseStudyCarousel';
import { PlanCards } from '../../../../src/components/landing/PlanCards';
import { FaqSection } from '../../../../src/components/landing/FaqSection';
import { Footer } from '../../../../src/components/landing/Footer';
import '../../../../src/components/landing/landing.css';

/** Introduces funding pre-screening while preserving account routing. The light fintech layout keeps illustrative content separate from real catalogue data. */
export function LandingPage() {
  const user = useCurrentUser();
  const { profile } = useCompanyProfile();
  const lang = useUiStore(state => state.lang);
  const copy = landingContent[lang];

  if (user && (user.role === 'admin' || profile))
    return <Navigate to={homePathFor(user)} replace />;

  return <div className="landing-page min-h-screen">
    <a className="landing-skip landing-cta" href="#landing-main">{copy.skipLink}</a>
    <LandingNavbar copy={copy.nav} hasProfile={Boolean(profile)} />
    <main id="landing-main" tabIndex={-1}>
      <HeroSection copy={copy.hero} />
      <FeatureTabs copy={copy.features} />
      <StatCounter copy={copy.stats} lang={lang} />
      <EntrepreneurBanner copy={copy.entrepreneur} />
      <ValueProposition copy={copy.value} disclaimer={copy.disclaimer} />
      <QuickActionBar copy={copy.quickAction} />
      <UseCases copy={copy.useCases} />
      <EditorialJourney copy={copy.journey} />
      <CaseStudyCarousel copy={copy.cases} />
      <PlanCards copy={copy.plans} hasProfile={Boolean(profile)} disclaimer={copy.disclaimer} />
      <FaqSection copy={copy.faq} />
    </main>
    <Footer copy={copy.footer} disclaimer={copy.disclaimer} />
  </div>;
}
