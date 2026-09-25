import type { Opportunity } from "@/features/scoring/types/scoring.types";

const EU_PORTAL = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home";
const HU_PORTAL = "https://www.palyazat.gov.hu/";

export interface ApplyLinks {
  /** The call's own page on the funder's site. */
  official: string | null;
  /** Direct link that opens a draft proposal (EU calls, when submission is open). */
  submit: string | null;
  /** The funder's general portal. */
  portal: string;
}

/**
 * Only links the portal itself published — never constructed by pattern. If a
 * call has neither an official page nor a submission link there is nothing
 * honest to point at, and the UI says so rather than showing a dead button.
 */
export function applyLinks(opp: Pick<Opportunity, "sourceUrl" | "submissionUrl" | "sourceSystem">): ApplyLinks {
  return {
    official: opp.sourceUrl || null,
    submit: opp.submissionUrl || null,
    portal: opp.sourceSystem === "EU_FUNDING_TENDERS" ? EU_PORTAL : HU_PORTAL,
  };
}

/** A hand-authored reference entry for a Hungarian programme, as opposed to a record pulled from a portal. */
export function isCuratedReference(links: ApplyLinks): boolean {
  return !links.official && !links.submit;
}
