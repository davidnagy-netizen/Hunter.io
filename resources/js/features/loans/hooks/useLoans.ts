import { useLoansQuery } from "../api/loans.queries";
import type { LoanRecord } from "../types/loans.types";

/** A Fundor Plus record, with its instrument type worded by the server. */
export interface LoanItem extends LoanRecord {
  typeLabel: string;
}

/**
 * The loan screen's data. A record carries only its type code; the server words each type once, in `categories`, and
 * every record takes its label from there — so a record's badge can never disagree with the category list.
 */
export function useLoans() {
  const { data, isLoading, error } = useLoansQuery();
  const labels = new Map(data?.categories.map((c) => [c.type, c.label]));
  const loans: LoanItem[] =
    data && !data.gated ? data.loans.map((loan) => ({ ...loan, typeLabel: labels.get(loan.instrument_type) ?? loan.instrument_type })) : [];

  return { data, loans, isLoading, error };
}
