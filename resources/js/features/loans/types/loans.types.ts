/** The debt instruments CR-02 keeps apart from grants (the server's `InstrumentType`, without `grant`). */
export type LoanInstrumentType = "subsidised_loan" | "guarantee" | "combined";

export interface LoanCategory {
  type: LoanInstrumentType;
  /** Already worded in the language the request asked for. */
  label: string;
  count: number;
}

/** One manually reviewed product with its provenance. `terms` is plain text transcribed from the Business Rules, not HTML. */
export interface LoanRecord {
  id: string;
  title: string;
  program: string;
  instrument_type: LoanInstrumentType;
  terms: string;
  deadline: string;
  effective_from_date: string;
  source_document_reference: string;
  last_verified_date: string;
}

interface LoanCatalogBase {
  /** Personalised evaluation stays off until the MNB legal opinion (CR-02). */
  evaluationStatus: "BLOCKED_PENDING_MNB_LEGAL_OPINION";
  /** Always `null`: an available product is not a claim of eligibility. */
  eligibleCount: null;
  availableCount: number;
  categories: LoanCategory[];
  requiredTier: string;
  /** Sent to every caller — it is never behind the paywall. */
  disclaimer: string;
}

export interface FullLoanCatalog extends LoanCatalogBase {
  gated: false;
  loans: LoanRecord[];
}

/** Without Fundor Plus: what exists (counts and categories), never which products or their terms. */
export interface GatedLoanCatalog extends LoanCatalogBase {
  gated: true;
  loans: [];
}

export type LoanCatalogResponse = FullLoanCatalog | GatedLoanCatalog;
