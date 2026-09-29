import { useTranslation } from "react-i18next";
import { buttonClasses } from "@/components";
import "../i18n";

/** Our consultation line: `tel:` needs the plain international form, people read the grouped one. */
const CONSULT_PHONE = "+36305080569";
const CONSULT_PHONE_DISPLAY = "+36 30 508 0569";

/**
 * "Need help? Call us", under the apply section of every grant's detail page. Only a tap-to-call link:
 * nothing is sent to the server and nothing about the visitor is collected.
 */
export function ConsultPanel() {
  const { t } = useTranslation("opportunities");
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-5 shadow-card">
      <p className="min-w-56 flex-1 text-sm text-text">{t("detail.consult.text")}</p>
      <a href={`tel:${CONSULT_PHONE}`} className={buttonClasses({ variant: "dark" })}>
        {t("detail.consult.call", { phone: CONSULT_PHONE_DISPLAY })}
      </a>
    </div>
  );
}
