import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { buttonClasses, LanguageToggle, Logo } from "@/shared/components";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import "../i18n";

/**
 * The nav, extracted from the hero section it used to be welded to. Reads
 * its own profile state (rather than receiving it as a prop) so it can sit
 * independently of Hero in the tree — the two need to move separately once
 * the header gets scroll-aware behaviour (sticky, background fading in;
 * Phase 3 work — this only sets up the file boundary for it).
 */
export function LandingHeader() {
  const { t } = useTranslation("landing");
  const { profile } = useCompanyProfile();

  return (
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
    </header>
  );
}
