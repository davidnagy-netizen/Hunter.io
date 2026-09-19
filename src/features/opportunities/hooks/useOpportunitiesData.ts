import { useMemo } from "react";
import { useRankedOpportunities } from "@/features/scoring/hooks/useScoring";
import { useCatalog } from "../api/opportunities.queries";
import { dashboardStats, splitShortlist, type DashboardStats } from "../domain/shortlist";
import type { Teaser } from "../types/opportunities.types";

const NO_TEASERS: Teaser[] = [];

/**
 * Everything the opportunity screens read, in one place: the catalog, ranked
 * for the current company (locally, with the server's own engine) and split
 * into what qualifies and what the engine ruled out.
 *
 * Two shapes hide behind it. A subscriber gets real opportunities. Anyone
 * else gets `gated: true`, no opportunities, server-scored `teasers`, and the
 * server's own totals — the browser has nothing to rank, so `stats` comes
 * from the server instead of being computed.
 */
export function useOpportunitiesData() {
  const { catalog, isLoading, error } = useCatalog();
  const gated = catalog?.gated ?? false;
  const ranked = useRankedOpportunities(catalog && !catalog.gated ? catalog.opportunities : undefined);
  const { eligible, blocked } = useMemo(() => splitShortlist(ranked), [ranked]);

  const stats: DashboardStats = useMemo(() => {
    if (catalog?.gated) {
      const s = catalog.stats;
      return { total: s.eligible, strong: s.strong, closingSoon: s.closingSoon, needsAttention: s.needsAnswer };
    }
    return dashboardStats(eligible);
  }, [catalog, eligible]);

  return {
    isLoading,
    error,
    gated,
    teasers: catalog?.gated ? catalog.teasers : NO_TEASERS,
    lockedTotal: catalog?.gated ? catalog.lockedTotal : 0,
    eligible,
    blocked,
    stats,
    /** Looks a call up in the full catalog; always `undefined` for a gated account. */
    find: (id: string) => (catalog && !catalog.gated ? catalog.opportunities.find((o) => o.id === id) : undefined),
  };
}
