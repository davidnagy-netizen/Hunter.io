import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, buttonClasses } from "@/components";
import { ConsultForm } from "./ConsultForm";
import "../i18n";

/** Our consultation line: `tel:` needs the plain international form, people read the grouped one. */
const CONSULT_PHONE = "+36305080569";
const CONSULT_PHONE_DISPLAY = "+36 30 508 0569";

/**
 * "Need help? Contact us", closing the how-to-apply part of every grant's detail page and the loans page: a
 * tap-to-call link, or a contact form that opens in place. Only the form sends anything, and only on submit.
 */
export function ConsultPanel() {
  const { t } = useTranslation("opportunities");
  const [formOpen, setFormOpen] = useState(false);
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-56 flex-1 text-sm text-text">{t("detail.consult.text")}</p>
        <a href={`tel:${CONSULT_PHONE}`} className={buttonClasses({ variant: "dark" })}>
          {t("detail.consult.call", { phone: CONSULT_PHONE_DISPLAY })}
        </a>
        <Button variant="ghost" aria-expanded={formOpen} onClick={() => setFormOpen((open) => !open)}>
          {t("detail.consult.form")}
        </Button>
      </div>
      {formOpen ? <ConsultForm /> : null}
    </div>
  );
}
