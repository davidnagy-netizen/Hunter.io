import { useTranslation } from "react-i18next";
import { Panel } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { GrantForm } from "@/features/admin/components/GrantForm";
import type { Plan } from "@/features/authentication/types/auth.types";
import { useInvalidateCrm } from "../api/crm.queries";
import type { CrmContact } from "../types/crm.types";
import "../i18n";

/** An account's access, with the same grant / revoke form as the users page — most stage changes end in one, so it's here rather than a screen away. */
export function AccessPanel({ contact, plans }: { contact: CrmContact; plans: Plan[] }) {
  const { t } = useTranslation("crm");
  const { money, date } = useFormat();
  const invalidateCrm = useInvalidateCrm();

  return (
    <Panel title={t("access.title")}>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted">{t("access.monthlyValue")}</div>
          <div className="text-sm font-medium">{contact.monthlyValueHuf ? money(contact.monthlyValueHuf) : "—"}</div>
        </div>
        <div>
          <div className="text-xs text-muted">{t("access.validUntil")}</div>
          <div className="text-sm font-medium">{contact.subscription.validUntil ? date(contact.subscription.validUntil) : "—"}</div>
        </div>
      </div>
      <GrantForm userId={contact.id} plans={plans} canRevoke={contact.subscription.active} onChanged={invalidateCrm} />
      <p className="mt-3 text-xs text-muted">{t("access.note")}</p>
    </Panel>
  );
}
