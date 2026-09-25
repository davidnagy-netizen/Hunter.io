import { useQuery } from "@tanstack/react-query";
import { metaApi } from "./meta.api";

export const metaKeys = {
  all: ["meta"] as const,
};

/**
 * Reference vocabularies (regions, industries, goals, revenue bands, org
 * types) plus catalog labels/stats. Lives in `shared/` — genuinely used by
 * `profile` (form options) and, later, `opportunities`/`admin` (facet and
 * catalog labels) — not any single feature's own concern.
 */
export function useMetaQuery() {
  return useQuery({
    queryKey: metaKeys.all,
    queryFn: metaApi.get,
    staleTime: 30 * 60_000,
  });
}
