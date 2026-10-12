import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, Button, Panel, buttonClasses } from "@/components";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { useCurrentUser } from "@/features/authentication/hooks/useAuth";
import { CONSULT_PHONE, CONSULT_PHONE_DISPLAY } from "@/features/opportunities/components/ConsultPanel";
import { useSwitchCompanyMutation } from "../api/profile.queries";
import "../i18n";

/**
 * The account's companies: which one Fundor is scoring for, switching to another, and adding one. Two are free; each
 * further one is 3000 Ft (one-time), which an admin unlocks once it is paid.
 */
export function CompaniesPanel() {
  const { t } = useTranslation(["profile", "errors"]);
  const user = useCurrentUser();
  const switchCompany = useSwitchCompanyMutation();
  const error = useTranslatedApiError(switchCompany.error);
  const companies = user?.companies ?? [];
  const limit = user?.profileLimit ?? 2;

  return (
    <Panel title={t("profile:companies.title")} subtitle={t("profile:companies.subtitle", { count: companies.length, limit })}>
      <ul className="divide-y divide-line">
        {companies.map((company) => (
          <li key={company.id} className="flex items-center justify-between gap-3 py-2.5">
            <b className="min-w-0 truncate text-sm text-text">{company.name}</b>
            {company.active ? (
              <Badge tone="green">{t("profile:companies.active")}</Badge>
            ) : (
              <Button size="sm" variant="ghost" disabled={switchCompany.isPending} onClick={() => switchCompany.mutate(company.id)}>
                {t("profile:companies.switch")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red">
          {error}
        </p>
      ) : null}
      {companies.length < limit ? (
        <Link to="/onboarding?new=1" className={buttonClasses({ variant: "ghost", className: "mt-4" })}>
          {t("profile:companies.add")}
        </Link>
      ) : (
        <p className="mt-4 rounded-md bg-gold-bg p-3 text-sm text-gold-deep">
          {t("profile:companies.limit")}{" "}
          <a href={`tel:${CONSULT_PHONE}`} className="font-semibold underline">
            {CONSULT_PHONE_DISPLAY}
          </a>
        </p>
      )}
    </Panel>
  );
}
