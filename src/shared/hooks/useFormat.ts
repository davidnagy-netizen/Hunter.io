import { useTranslation } from "react-i18next";
import { formatDate, formatDateTime, formatHuf, formatMonth, type Lang } from "@/shared/lib/format";

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
    date: (iso: string) => formatDate(iso, lang),
    dateTime: (iso: string) => formatDateTime(iso, lang),
    month: (year: number, month: number) => formatMonth(year, month, lang),
  };
}
