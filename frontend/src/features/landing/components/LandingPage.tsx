import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router";
import { ArrowIcon, Button, CircularProgress, LanguageToggle, Logo, TargetIcon, CheckBadge, WarnBadge, buttonClasses } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { useCurrentUser } from "@/features/authentication/hooks/useAuth";
import { homePathFor } from "@/features/authentication/lib/homePath";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { ComparisonSection } from "./ComparisonSection";
import { HowItWorks, PriceTeaser, Sources } from "./InfoSections";
import "../i18n";
import { BRAND } from "@/shared/brand";

function HeroPreview() {
  const { t } = useTranslation("landing");
  const { date } = useFormat();
  return (
    <div className="w-72 rounded-lg bg-surface p-4 text-text shadow-card-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-muted">{t("preview.program")}</div>
          <h3 className="font-display text-base font-semibold">{t("preview.title")}</h3>
        </div>
        <CircularProgress value={87} size={58} strokeWidth={6} color="var(--color-gold)" aria-label={`${BRAND.name} Score 87`}>
          <span className="font-display text-sm font-semibold">87</span>
        </CircularProgress>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        <li className="flex gap-2">
          <CheckBadge />
          <span>
            <b>{t("preview.pass")}</b> <span className="text-muted">{t("preview.passYours")}</span>
          </span>
        </li>
        <li className="flex gap-2">
          <WarnBadge />
          <span>
            <b>{t("preview.warn")}</b> <span className="text-muted">{t("preview.warnYours")}</span>
          </span>
        </li>
      </ul>
      <div className="mt-3 flex justify-between border-t border-line pt-2 text-xs text-muted">
        <span>
          {t("preview.funding")} <b className="text-text">{t("preview.fundingValue")}</b>
        </span>
        <span>
          {t("preview.deadline")} <b className="text-text">{date(t("preview.deadlineDate"))}</b>
        </span>
      </div>
    </div>
  );
}

/**
 * The public front door: the pitch, a worked example, and two ways in — the
 * free assessment or a company account. A signed-in visitor with a profile
 * has no use for it and is sent straight to their matches; an anonymous one
 * who already built a profile gets an "open the app" link instead, so they
 * are never trapped away from it.
 */
export function LandingPage() {
  const { t } = useTranslation("landing");
  const user = useCurrentUser();
  const { profile } = useCompanyProfile();

  // An administrator has no use for a company profile, so they go straight to the console.
  if (user && (user.role === "admin" || profile)) return <Navigate to={homePathFor(user)} replace />;

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Logo dark />
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <Link to="/assess" className="text-white/80 hover:text-white">
              {t("nav.assess")}
            </Link>
            <a href="#how" className="text-white/80 hover:text-white">
              {t("nav.how")}
            </a>
            {profile ? (
              <Link to="/app" className={buttonClasses({ variant: "gold", size: "sm" })}>
                {t("nav.openApp")}
              </Link>
            ) : (
              <Link to="/login" className={buttonClasses({ variant: "ghost-light", size: "sm" })}>
                {t("nav.login")}
              </Link>
            )}
            <LanguageToggle tone="dark" />
          </div>
        </nav>

        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 pb-20 pt-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold">
              <TargetIcon size={14} /> {t("hero.eyebrow")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-5xl">
              {t("hero.line1")}
              <br />
              <span className="text-gold">{t("hero.line2")}</span>
            </h1>
            <p className="mt-4 max-w-md text-white/75">{t("hero.lead")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/assess" className={buttonClasses({ variant: "gold" })}>
                {t("hero.cta")} <ArrowIcon />
              </Link>
              <Link to="/register">
                <Button variant="ghost-light">{t("hero.register")}</Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-white/60">
              {t("hero.trust")} <b className="text-white/80">{t("hero.trustNames")}</b>
            </p>
          </div>
          <div className="relative pb-16 md:pb-10">
            <img
              src={`${import.meta.env.BASE_URL}hero.jpg`}
              alt={t("hero.imageAlt")}
              width={740}
              height={452}
              loading="eager"
              className="w-full rounded-lg object-cover shadow-card-lg"
            />
            <div className="absolute -bottom-2 left-2 md:-left-8">
              <HeroPreview />
            </div>
          </div>
        </div>
      </header>

      <main>
        <ComparisonSection />
        <HowItWorks />
        <Sources />
        <PriceTeaser />
      </main>

      <footer className="border-t border-line px-6 py-8 text-center text-xs text-muted">{t("footer")}</footer>
    </div>
  );
}
