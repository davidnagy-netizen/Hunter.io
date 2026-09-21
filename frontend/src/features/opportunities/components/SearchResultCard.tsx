import type { CardModel } from "../domain/cardModel";
import type { SearchRow } from "../types/opportunities.types";
import { OpportunityCardView } from "./OpportunityCardView";

/** A search hit, scored by the server (its `toCard`) — same card, different source. */
export function SearchResultCard({ row }: { row: SearchRow }) {
  const model: CardModel = {
    id: row.id,
    program: row.program,
    title: row.title,
    deadline: row.deadline,
    daysLeft: row.daysLeft,
    intensity: row.intensity,
    fundingMin: row.fundingMin,
    fundingMax: row.fundingMax,
    sourceUrl: row.sourceUrl,
    score: row.score,
    blocked: row.blocked,
    verdict: row.verdict,
    exclusionReason: row.blockedReasons[0] ?? null,
  };
  return <OpportunityCardView model={model} />;
}
