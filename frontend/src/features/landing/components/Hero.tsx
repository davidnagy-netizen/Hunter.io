import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowIcon, buttonClasses } from "@/shared/components";
import { HeroPreviewCard } from "./HeroPreviewCard";
import "../i18n";

/**
 * The first screen a visitor sees, built around one action: the free
 * assessment. Creating an account outright is offered as a plain link, not
 * a second full-weight button — two co-equal buttons split attention and
 * work against the primary action.
 *
 * No stock photography. The argument for "why this is worth clicking" is
 * `HeroPreviewCard` — a mockup of the product actually scoring a call — not
 * a decorative image with a card floating on top of it.
 */
export function Hero() {
  const { t } = useTranslation("landing");
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 pb-20 pt-14 md:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
            {t("hero.line1")}
            <br />
            <span className="text-gold">{t("hero.line2")}</span>
          </h1>
          <p className="mt-4 max-w-md text-white/75">{t("hero.lead")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to="/assess" className={buttonClasses({ variant: "gold" })}>
              {t("hero.cta")} <ArrowIcon />
            </Link>
            <Link to="/register" className="text-sm font-medium text-white/70 hover:text-white">
              {t("hero.register")}
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <HeroPreviewCard />
        </div>
      </div>
    </section>
  );
}
