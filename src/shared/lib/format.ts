export type Lang = "hu" | "en";

const locale = (lang: Lang) => (lang === "en" ? "en-GB" : "hu-HU");

/** `30 M Ft` / `1,5 Mrd Ft` in Hungarian, `30M HUF` / `1.5 bn HUF` in English — same output as the legacy `fmtHUF`. */
export function formatHuf(amount: number, lang: Lang): string {
  if (amount >= 1e9) {
    return (
      (amount / 1e9).toLocaleString(locale(lang), { maximumFractionDigits: 1 }) + (lang === "en" ? " bn HUF" : " Mrd Ft")
    );
  }
  return Math.round(amount / 1e6).toLocaleString(locale(lang)) + (lang === "en" ? "M HUF" : " M Ft");
}

/** `2027.01.20.` in Hungarian, `20 Jan 2027` in English. */
export function formatDate(iso: string, lang: Lang): string {
  const date = new Date(iso);
  if (lang === "en") return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
  return date.toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\s/g, "");
}

/** "October 2026" / "2026. október" — a month heading. `month` is 1–12. */
export function formatMonth(year: number, month: number, lang: Lang): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  const name = date.toLocaleDateString(locale(lang), { month: "long", timeZone: "UTC" });
  const cased = name.charAt(0).toUpperCase() + name.slice(1);
  return lang === "en" ? `${cased} ${year}` : `${year}. ${name}`;
}
