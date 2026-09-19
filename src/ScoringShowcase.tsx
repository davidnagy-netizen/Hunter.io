import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/httpClient";
import { Panel } from "@/shared/components";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import { EligibilityBadge } from "@/features/scoring/components/EligibilityBadge";
import { EligibilityQuestion } from "@/features/scoring/components/EligibilityQuestion";
import { HunterScoreRing } from "@/features/scoring/components/HunterScoreRing";
import { ScoreBreakdown } from "@/features/scoring/components/ScoreBreakdown";
import { useScoringInputs, useRankedOpportunities } from "@/features/scoring/hooks/useScoring";
import type { Opportunity } from "@/features/scoring/types/scoring.types";

/**
 * TEMPORARY — exercises the `scoring` feature against the real catalog.
 * The catalog query below is a throwaway stand-in for the `opportunities`
 * feature's own (next slice); delete this file with the showcase page.
 */
export function ScoringShowcase() {
  const isSubscriber = useIsSubscriber();
  const { profile } = useCompanyProfile();
  const { answers } = useScoringInputs();
  const catalog = useQuery({
    queryKey: ["temp-catalog"],
    queryFn: () => httpClient.get<{ opportunities: Opportunity[] }>("/catalog").then((r) => r.data),
    enabled: isSubscriber,
  });
  const ranked = useRankedOpportunities(catalog.data?.opportunities);
  // Verification hook only: lets a browser session diff local scores against the server's.
  (window as unknown as { __scores: unknown }).__scores = Object.fromEntries(
    ranked.map((r) => [r.opp.id, r.res.blocked ? null : r.res.score]),
  );

  if (!isSubscriber) {
    return (
      <Panel title="Scoring (live catalog)" subtitle="Needs a subscriber or admin session — the server withholds the catalog otherwise">
        <p className="text-sm text-muted">Sign in as a subscriber to see local scoring.</p>
      </Panel>
    );
  }
  if (!profile) {
    return (
      <Panel title="Scoring (live catalog)">
        <p className="text-sm text-muted">Set up a company profile first.</p>
      </Panel>
    );
  }

  const eligible = ranked.filter((r) => !r.res.blocked);
  const blocked = ranked.length - eligible.length;
  const asking = eligible.filter((r) => r.res.estimated).length;
  const top = eligible[0];
  const firstUnknown = eligible.find((r) => r.res.estimated);
  const unknownRule = firstUnknown?.res.elig.checks.find((c) => c.status === "unknown" && c.rule.quiz)?.rule;

  return (
    <Panel
      title="Scoring (live catalog)"
      subtitle="Scored in the browser with the server's own engine — temporary, next slice replaces this"
    >
      <p data-testid="counts" className="text-sm">
        {ranked.length} open · <b>{eligible.length} eligible</b> · {blocked} blocked · {asking} need an answer · answers:{" "}
        {JSON.stringify(answers)}
      </p>

      {top ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <HunterScoreRing score={top.res.score} estimated={top.res.estimated} size={110} />
            <div>
              <EligibilityBadge status={top.res.elig.status} />
              <p className="mt-1 text-sm font-medium">{top.opp.title}</p>
              <p className="text-xs text-muted">{top.opp.program}</p>
            </div>
          </div>
          <ScoreBreakdown opp={top.opp} profile={profile} result={top.res} />
        </div>
      ) : null}

      {firstUnknown && unknownRule ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs text-muted">First call waiting on an answer: {firstUnknown.opp.title}</p>
          <EligibilityQuestion oppId={firstUnknown.opp.id} rule={unknownRule} />
        </div>
      ) : null}

      <ol className="mt-5 flex flex-col gap-1.5 text-sm">
        {eligible.slice(1, 6).map((r) => (
          <li key={r.opp.id} className="flex items-center gap-2">
            <b className="w-8 tabular-nums">{r.res.score}</b>
            <EligibilityBadge status={r.res.elig.status} />
            <span className="truncate">{r.opp.title}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
