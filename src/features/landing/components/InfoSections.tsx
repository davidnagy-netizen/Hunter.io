import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button, Reveal } from "@/shared/components";
import "../i18n";

/** "How it works": three numbered steps. */
export function HowItWorks() {
  const { t } = useTranslation("landing");
  const items = t("how.items", { returnObjects: true }) as { title: string; text: string }[];
  return (
    <Reveal>
      <section id="how" className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{t("how.kicker")}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">{t("how.title")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <div key={item.title} className="rounded-lg border border-line bg-surface p-5 shadow-card">
              <div className="flex size-8 items-center justify-center rounded-full bg-gold-bg font-display font-semibold text-gold-deep">
                {i + 1}
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/** The sources the pitch cites. */
export function Sources() {
  const { t } = useTranslation("landing");
  const chips = t("sources.chips", { returnObjects: true }) as string[];
  return (
    <Reveal>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{t("sources.kicker")}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">{t("sources.title")}</h2>
        <p className="mt-2 text-muted">{t("sources.sub")}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
              <span aria-hidden className="size-2 rounded-full bg-green" />
              {chip}
            </span>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/** The price teaser: the monthly fee framed against the funding on offer. */
export function PriceTeaser() {
  const { t } = useTranslation("landing");
  return (
    <Reveal>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-lg bg-ink p-8 text-white">
          <div className="max-w-md">
            <h2 className="font-display text-2xl font-semibold">{t("price.title")}</h2>
            <p className="mt-2 text-sm text-white/70">{t("price.note")}</p>
          </div>
          <div className="min-w-56 rounded-lg bg-white/10 p-5 text-center">
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
      </section>
    </Reveal>
  );
}
