import { useTranslation } from "react-i18next";
import { ShieldIcon } from "@/shared/components";
import blueprintPhoto from "../assets/comparison-blueprints.jpg";
import { GsapReveal } from "./GsapReveal";
import { Kicker } from "./Kicker";
import { Section } from "./Section";
import "../i18n";

/**
 * The sources the pitch cites — styled as small certification tiles (a shield mark, the source
 * name) rather than plain filter-chip pills, closer to how a compliance page presents SOC2/ISO/
 * GDPR marks: these sources are the credibility argument, not a set of toggleable filters, so
 * they shouldn't look like ones.
 *
 * Doesn't use `Section`'s own kicker/title/subtitle rendering — that stacks them full-width, and
 * the photo needs to sit beside them instead. The classes below are copied from `Section` itself
 * so this still matches every other section's header exactly.
 */
export function Sources() {
  const { t } = useTranslation("landing");
  const chips = t("sources.chips", { returnObjects: true }) as string[];
  return (
    <GsapReveal>
      <Section className="py-16">
        <div className="flex flex-wrap items-center gap-8 md:flex-nowrap">
          <div className="flex-1">
            <Kicker>{t("sources.kicker")}</Kicker>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-[1.05] tracking-[-0.025em] text-ink">{t("sources.title")}</h2>
            <p className="mt-3 max-w-[440px] text-[15.5px] tracking-[-0.011em] text-muted">{t("sources.sub")}</p>
          </div>
          {/* The same blueprint photo the chapter's own background uses, here at full strength —
           * the "official paperwork" this section is actually about, not just a texture. Desktop
           * only: there's no spare width for it once the header wraps to full-bleed on mobile. */}
          <div className="hidden h-36 w-56 shrink-0 overflow-hidden border border-line md:block">
            <img src={blueprintPhoto} alt="" className="h-full w-full object-cover grayscale" />
          </div>
        </div>
        {/* The `md:mt-3` on alternating tiles is what keeps this from reading as one flat,
         * perfectly ruled grid — a light brick-course offset instead of every tile's top edge
         * lining up. `margin-top`, not a `translate-y` class: `GsapReveal`'s own stagger animates
         * `transform` via GSAP, which sets it inline once the reveal finishes — a class-based
         * transform offset would get silently overwritten the moment that inline style lands.
         * Mobile stays flat (2 columns is too narrow for the offset to read as anything but
         * misaligned). */}
        <GsapReveal className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" stagger={0.05}>
          {chips.map((chip, i) => (
            <div
              key={chip}
              className={[
                "flex flex-col gap-3 border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-gold/40 hover:shadow-card-lg",
                i % 2 === 1 ? "md:mt-3" : "",
              ].join(" ")}
            >
              <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-bg text-green">
                <ShieldIcon size={14} />
              </span>
              <span className="text-[13.5px] font-medium leading-snug tracking-[-0.011em]">{chip}</span>
            </div>
          ))}
        </GsapReveal>
      </Section>
    </GsapReveal>
  );
}
