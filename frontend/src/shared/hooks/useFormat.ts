import { useTranslation } from "react-i18next";
import { formatDate, formatDateTime, formatHuf, formatMoney, formatMonth, type Lang } from "@/shared/lib/format";

/** The active UI language, narrowed to the two we support. */
export function useLang(): Lang {
  const { i18n } = useTranslation();
  return i18n.language === "en" ? "en" : "hu";
}

/** Money, date and timestamp formatters bound to the active language. */
export function useFormat() {
  const lang = useLang();
  return {
    lang,
    huf: (amount: number) => formatHuf(amount, lang),
    money: (amount: number) => formatMoney(amount, lang),
    /** For a figure the server may not know (`null`): a dash, never a made-up 0. */
    moneyOrDash: (amount: number | null | undefined) => (amount == null ? "—" : formatMoney(amount, lang)),
    date: (iso: string) => formatDate(iso, lang),
    dateTime: (iso: string) => formatDateTime(iso, lang),
    month: (year: number, month: number) => formatMonth(year, month, lang),
  };
}
