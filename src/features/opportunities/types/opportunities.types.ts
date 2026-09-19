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
