import { Navigate } from 'react-router';
import { useCurrentUser } from '@/features/authentication/hooks/useAuth';
import { homePathFor } from '@/features/authentication/lib/homePath';
import { useCompanyProfile } from '@/features/profile/hooks/useCompanyProfile';
import { useUiStore } from '@/store/uiStore';
import { landingContent } from '../../../../src/data/landingContent';
import { GsapReveal } from '../../../../src/components/landing/GsapReveal';
import { useLenisScroll } from '../../../../src/components/landing/hooks/useLenisScroll';
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
  useLenisScroll();

  if (user && (user.role === 'admin' || profile))
    return <Navigate to={homePathFor(user)} replace />;

  return <div className="landing-page min-h-screen">
    <a className="landing-skip landing-cta" href="#landing-main">{copy.skipLink}</a>
    <LandingNavbar copy={copy.nav} hasProfile={Boolean(profile)} />
    <main id="landing-main" tabIndex={-1}>
      <HeroSection copy={copy.hero} />
      <GsapReveal><FeatureTabs copy={copy.features} /></GsapReveal>
      <GsapReveal><StatCounter copy={copy.stats} lang={lang} /></GsapReveal>
      <GsapReveal><EntrepreneurBanner copy={copy.entrepreneur} /></GsapReveal>
      <GsapReveal><ValueProposition copy={copy.value} /></GsapReveal>
      <GsapReveal><QuickActionBar copy={copy.quickAction} /></GsapReveal>
      <GsapReveal><UseCases copy={copy.useCases} /></GsapReveal>
      <GsapReveal><EditorialJourney copy={copy.journey} /></GsapReveal>
      <GsapReveal><CaseStudyCarousel copy={copy.cases} /></GsapReveal>
      <GsapReveal><PlanCards copy={copy.plans} hasProfile={Boolean(profile)} /></GsapReveal>
      <GsapReveal><FaqSection copy={copy.faq} /></GsapReveal>
    </main>
    <Footer copy={copy.footer} disclaimer={copy.disclaimer} />
  </div>;
}
