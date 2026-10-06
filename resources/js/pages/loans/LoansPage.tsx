import { useTranslation } from "react-i18next";
import { PageHead, Panel, QueryStatus, StepList, type Step } from "@/components";
import { ConsultPanel } from "@/features/opportunities/components/ConsultPanel";
import { LoanCard } from "@/features/loans/components/LoanCard";
import { LoansLockedPanel } from "@/features/loans/components/LoansLockedPanel";
import { useLoans } from "@/features/loans/hooks/useLoans";
import "@/features/loans/i18n/index";

/**
 * Subsidised loans, guarantees and combined products (CR-02) on a screen of their own, never mixed into the grant
 * lists: a loan is debt, and its principal is not funding. Information only — the server neither scores nor ranks
 * them while the MNB legal opinion is pending. The regulatory disclaimer is not repeated here: every tier already sees
 * the same sentence in the banner above every page (`RegulatoryDisclaimer`, mounted in `main.tsx`).
 */
export function LoansPage() {
  const { t } = useTranslation("loans");
  const { data, loans, isLoading, error } = useLoans();

  return (
    <>
      <PageHead title={t("title")}>{t("subtitle")}</PageHead>
      <QueryStatus isLoading={isLoading} error={error} />

      {data ? (
        <div className="flex flex-col gap-4">
          {data.availableCount === 0 ? (
            <Panel>
              <p className="text-sm text-muted">{t("empty")}</p>
            </Panel>
          ) : data.gated ? (
            <LoansLockedPanel availableCount={data.availableCount} categories={data.categories} requiredTier={data.requiredTier} />
          ) : (
            <>
              {loans.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
              {/* Information-only how-to and our contact line after the products, as on a grant's detail page. */}
              <Panel title={t("apply.title")} subtitle={t("apply.body")}>
                <StepList steps={t("apply.steps", { returnObjects: true }) as Step[]} />
              </Panel>
              <ConsultPanel />
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
