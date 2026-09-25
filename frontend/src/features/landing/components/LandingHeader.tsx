import { useCompanyProfile } from "@/shared/hooks/useCompanyProfile";
import { ArrowIcon, LanguageToggle, Logo } from "@/shared/components";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import "../i18n";

/**
 * The nav, extracted from the hero section it used to be welded to. Reads
 * its own profile state (rather than receiving it as a prop) so it can sit
 * independently of Hero in the tree.
 *
 * Sticky for the whole page, not just the hero — and a constant translucent
 * dark tint rather than starting fully transparent: it now sits over every
 * chapter, light ones included, and a fully clear header would flash the
 * page's own light background through it for an instant before any scroll
 * has happened. `isSolid` still gates the compact CTA (the hero's own big
 * CTA has scrolled out of reach by then) and nudges the tint up slightly
 * once scrolled, for legibility over busier content further down.
 */
export function LandingHeader() {
  const { t } = useTranslation("landing");
  const { profile } = useCompanyProfile();
  const [isSolid, setIsSolid] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setIsSolid(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300",
        isSolid ? "border-white/10 bg-ink/75" : "border-white/5 bg-ink/50",
      ].join(" ")}
    >
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Logo dark />
        <div className="hidden items-center gap-8 text-sm md:flex">
          <Link
            to="/assess"
            className="text-white/70 tracking-[-0.011em] transition-colors hover:text-white"
          >
            {t("nav.assess")}
          </Link>
          <a
            href="#how"
            onClick={(e) => {
              // Intercepted so this can be `smooth` on its own, scoped to this one jump, rather
              // than a global `scroll-behavior: smooth` that would also apply to the signed-in
              // app's own scroll-into-view calls (a validation-error jump, say) where an animated
              // scroll would read as slower, not nicer.
              e.preventDefault();
              document.getElementById("how")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
            }}
            className="text-white/70 tracking-[-0.011em] transition-colors hover:text-white"
          >
            {t("nav.how")}
          </a>
        </div>
        <div className="flex items-center gap-3.5">
          <Link
            to="/assess"
            aria-hidden={!isSolid}
            tabIndex={isSolid ? undefined : -1}
            className={[
              "hidden items-center gap-2 whitespace-nowrap rounded-control bg-gold px-4 py-2 text-[13.5px] font-bold tracking-[-0.011em] text-[#1a1000] transition-[max-width,opacity] duration-300 md:flex",
              isSolid
                ? "pointer-events-auto max-w-60 opacity-100"
                : "pointer-events-none max-w-0 overflow-hidden opacity-0",
            ].join(" ")}
          >
            {t("nav.assess")} <ArrowIcon size={13} />
          </Link>
          <div className="hidden md:block">
            <LanguageToggle tone="dark" />
          </div>
          {profile ? (
            <Link
              to="/app"
              className="rounded-control bg-gold px-4.5 py-2 text-sm font-semibold tracking-[-0.011em] text-[#1a1000]"
            >
              {t("nav.openApp")}
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-control border border-white/28 px-4.5 py-2 text-sm font-semibold tracking-[-0.011em] text-white"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
