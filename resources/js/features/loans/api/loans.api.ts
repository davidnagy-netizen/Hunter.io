import { httpClient } from "@/api/httpClient";
import type { LoanCatalogResponse } from "../types/loans.types";

export const loansApi = {
  /** The session cookie decides what comes back: terms and provenance for Fundor Plus, counts and categories otherwise. */
  list: (lang: string) => httpClient.get<LoanCatalogResponse>("/loans", { params: { lang } }).then((res) => res.data),
};
