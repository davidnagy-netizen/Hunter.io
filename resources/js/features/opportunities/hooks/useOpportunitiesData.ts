import { useMemo } from "react";
import { useCatalog } from "../api/opportunities.queries";
import { rankScored, splitShortlist, type DashboardStats } from "../domain/shortlist";
import type { Teaser } from "../types/opportunities.types";

const NO_TEASERS: Teaser[] = [];
const NO_ROWS: never[] = [];

/**
 * Everything the opportunity screens read, in one place: the catalog as the
 * server scored it for the current company, ordered for display and split
 * into what qualifies and what was ruled out. Nothing is scored in the
 * browser.
 *
 * Two shapes hide behind it. A subscriber gets scored opportunities. Anyone
 * else gets `gated: true`, no opportunities, server-scored `teasers`, and the
 * server's own totals.
 */
export function useOpportunitiesData() {
  const { catalog, isLoading, error } = useCatalog();
  const gated = catalog?.gated ?? false;
  const ranked = useMemo(() => (catalog && !catalog.gated ? rankScored([...catalog.opportunities]) : NO_ROWS), [catalog]);
  const { eligible, blocked } = useMemo(() => splitShortlist(ranked), [ranked]);

  const stats: DashboardStats = useMemo(() => {
    const s = catalog?.stats;
    return { total: s?.eligible ?? 0, strong: s?.strong ?? 0, closingSoon: s?.closingSoon ?? 0, needsAttention: s?.needsAnswer ?? 0 };
  }, [catalog]);

  return {
    isLoading,
    error,
    gated,
    teasers: catalog?.gated ? catalog.teasers : NO_TEASERS,
    lockedTotal: catalog?.gated ? catalog.lockedTotal : 0,
    /** Every ranked call, including prizes and labels — for screens that show what the user chose (saved). */
    ranked,
    eligible,
    blocked,
    stats,
    /** Looks a call up in the full catalog; always `undefined` for a gated account. */
    find: (id: string) => (catalog && !catalog.gated ? catalog.opportunities.find((o) => o.id === id) : undefined),
  };
}
