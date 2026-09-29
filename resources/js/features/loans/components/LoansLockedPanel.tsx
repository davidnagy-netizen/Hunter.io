import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, LockIcon, Panel, buttonClasses } from "@/components";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import type { LoanCategory } from "../types/loans.types";
import "../i18n";

interface LoansLockedPanelProps {
  availableCount: number;
  categories: LoanCategory[];
  requiredTier: string;
}

/**
 * What someone without Fundor Plus gets: how many reviewed products exist and of which kind — the server's real counts,
 * so the upgrade prompt rests on something — but no product, term or source (the server never sent them). The count is
 * of the catalog, not of the company's eligibility: the server evaluates none.
 */
export function LoansLockedPanel({ availableCount, categories, requiredTier }: LoansLockedPanelProps) {
  const { t } = useTranslation("loans");
  const isAuthenticated = useIsAuthenticated();

  return (
    <Panel>
      <h2 className="font-display text-lg font-semibold text-ink">{t("locked.count", { count: availableCount })}</h2>
      <p className="mt-1 text-sm text-muted">{t("locked.note")}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {categories.map((c) => (
          <li key={c.type}>
            <Badge tone="blue">
              {c.label} · {c.count}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-2 rounded-md bg-paper p-3 text-sm text-muted">
        <LockIcon className="mt-0.5 shrink-0" />
        <span>{t("locked.body", { tier: requiredTier })}</span>
      </p>
      {!isAuthenticated ? (
        <Link to="/register" className={buttonClasses({ variant: "dark", className: "mt-4" })}>
          {t("locked.cta")}
        </Link>
      ) : null}
    </Panel>
  );
}
