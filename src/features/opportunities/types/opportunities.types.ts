import type { Entitlements } from "@/features/authentication/types/auth.types";
import type { Opportunity } from "@/features/scoring/types/scoring.types";

/**
 * What a visitor without a subscription gets in place of an opportunity: a
 * real score and a real money figure, but nothing that identifies the call
 * (the server withholds title, programme, id, deadline and links — see
 * `teaserCard` in `server/server.js`).
 */
export interface Teaser {
  ref: string;
  locked: true;
  score: number | null;
  band: { key: string; label: string } | null;
  estimated: boolean;
  /** What *this company* would receive: its project value × the call's intensity. */
  grantHuf: number | null;
  fundingMax: number | null;
  intensity: number | null;
  closingSoon: boolean;
}

export interface CatalogStats {
  catalogTotal: number;
  openTotal: number;
  eligible: number;
  blocked: number;
  strong: number;
  closingSoon: number;
  needsAnswer: number;
}

interface CatalogBase {
  builtAt: string | null;
  referenceDate: string | null;
  eurHuf: number | null;
  entitlements: Entitlements;
}

export interface FullCatalogResponse extends CatalogBase {
  gated: false;
  total: number;
  opportunities: Opportunity[];
}

export interface GatedCatalogResponse extends CatalogBase {
  gated: true;
  total: number;
  /** How many eligible calls exist beyond what this account may see. */
  lockedTotal: number;
  opportunities: Opportunity[];
  teasers: Teaser[];
  stats: CatalogStats;
}

export type CatalogResponse = FullCatalogResponse | GatedCatalogResponse;

export interface SaveOpportunityResponse {
  success: true;
  saved: string[];
  isSaved: boolean;
}

/** A scored result row from `GET/POST /api/search` (the server's `toCard`). */
export interface SearchRow {
  id: string;
  title: string;
  program: string;
  sourceRef?: string;
  sourceUrl?: string | null;
  submissionUrl?: string | null;
  deadline: string;
  daysLeft: number;
  goals: string[];
  intensity: number;
  fundingMin?: number | null;
  fundingMax?: number | null;
  consortium?: { required: boolean; minPartners: number; minCountries: number };
  score: number | null;
  blocked: boolean;
  estimated: boolean;
  verdict: "ELIGIBLE" | "CONDITIONAL" | "INSUFFICIENT_DATA" | "NOT_ELIGIBLE" | null;
  band: { key: string; label: string } | null;
  /** Already worded in the language the request asked for. */
  blockedReasons: string[];
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  pageSize: number;
  sort: string;
  facets: Record<string, FacetValue[]>;
  /** Rows for a subscriber; for anyone else every row is a locked `Teaser`. */
  results: (SearchRow | Teaser)[];
  lockedCount: number;
}

export function isLockedRow(row: SearchRow | Teaser): row is Teaser {
  return "locked" in row && row.locked === true;
}
