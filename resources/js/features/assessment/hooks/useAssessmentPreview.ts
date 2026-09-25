import { useQuery } from "@tanstack/react-query";
import { opportunitiesApi } from "@/features/opportunities/api/opportunities.api";
import type { Teaser } from "@/features/opportunities/types/opportunities.types";
import { useLang } from "@/composables/useFormat";
import type { CompanyProfile } from "@/features/profile/types/profile.types";

export interface AssessmentPreview {
  /** How many calls this profile qualifies for — the server's own count. */
  eligible: number;
  teasers: Teaser[];
}

/**
 * The real matches behind the readiness score, as censored teasers: a genuine
 * score and grant amount for each, nothing that names the call. Uses the same
 * endpoint as the app's catalog; the visitor is anonymous, so the profile
 * travels in the request body.
 */
export function useAssessmentPreview(profile: CompanyProfile | null) {
  const lang = useLang();
  return useQuery({
    queryKey: ["assessment", "preview", lang, profile] as const,
    queryFn: async (): Promise<AssessmentPreview> => {
      const catalog = await opportunitiesApi.catalogFor(profile!, lang);
      // A visitor is always gated. If a subscriber somehow gets here, there
      // are no teasers to show and no server-side count to report.
      if (!catalog.gated) return { eligible: 0, teasers: [] };
      return { eligible: catalog.stats.eligible || catalog.lockedTotal, teasers: catalog.teasers };
    },
    enabled: profile !== null,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
