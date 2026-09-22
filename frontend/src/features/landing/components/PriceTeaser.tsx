import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button, Reveal } from "@/shared/components";
import { Section } from "./Section";
import "../i18n";

/** The price teaser: the monthly fee framed against the funding on offer. */
export function PriceTeaser() {
  const { t } = useTranslation("landing");
  return (
    <Reveal>
      <Section className="py-12">
        <div className="flex flex-wrap items-center justify-between gap-8 bg-ink p-8 text-white">
          <div className="max-w-md">
            <h2 className="font-display text-2xl font-semibold">{t("price.title")}</h2>
            <p className="mt-2 text-sm text-white/70">{t("price.note")}</p>
          </div>
          <div className="min-w-56 bg-white/10 p-5 text-center">
            <div className="font-display text-3xl font-semibold text-gold">{t("price.amount")}</div>
            <div className="text-sm text-white/70">{t("price.per")}</div>
            <div className="mt-1 text-xs text-white/60">{t("price.versus")}</div>
            <Link to="/assess" className="mt-4 block">
              <Button variant="gold" block>
                {t("price.cta")}
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </Reveal>
  );
}
