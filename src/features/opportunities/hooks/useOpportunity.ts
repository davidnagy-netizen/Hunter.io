import { useOpportunityDetailQuery } from "../api/opportunities.queries";
import { useOpportunitiesData } from "./useOpportunitiesData";

/**
 * One call by id: from the catalog when it's there (no request), otherwise
 * from the server. Never resolves for a gated account — the server withholds
 * a call's identity from them by design, so there is nothing to show.
 */
export function useOpportunity(oppId: string) {
  const data = useOpportunitiesData();
  const inCatalog = data.find(oppId);
  const needsFetch = !data.isLoading && !data.error && !data.gated && !inCatalog && oppId !== "";
  const detail = useOpportunityDetailQuery(oppId, needsFetch);

  return {
    opp: inCatalog ?? detail.data,
    gated: data.gated,
    isLoading: data.isLoading || (needsFetch && detail.isLoading),
    error: data.error,
  };
}
