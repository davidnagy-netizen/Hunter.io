/**
 * The marketing page's own primary CTA look — a diagonal fill-sweep on
 * hover, not the flat color swap or the glow-shadow `shared/components`'
 * `buttonClasses` uses elsewhere in the signed-in app. Deliberately a
 * separate, landing-only style rather than a variant on the shared helper:
 * the glow-on-hover button is one of the most recognizable generated-SaaS
 * tells, and this is the fix for that, specific to this page.
 *
 * Expressed as Tailwind arbitrary values (no bespoke CSS file) so it stays
 * consistent with how every other landing component is styled.
 */
export function landingCtaClasses(block = false): string {
  return [
    "inline-flex items-center justify-center gap-2.5 rounded-control px-6.5 py-3.5 text-[15px] font-bold tracking-[-0.011em] text-[#1a1000]",
    "bg-gold bg-[linear-gradient(105deg,var(--color-gold-deep)_50%,var(--color-gold)_50%)] bg-[length:210%_100%] bg-[position:100%_0%]",
    "transition-[background-position,transform,color] duration-[400ms] ease-out",
    "hover:-translate-y-px hover:bg-[position:0%_0%] hover:text-white",
    block ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
