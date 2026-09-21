/** Test-only declarations for server data modules, used by `engine.test.ts`. */
declare module "@engine-src/data/mockGrants.js" {
  import type { Opportunity } from "@/features/scoring/types/scoring.types";
  export const OPPS: Opportunity[];
}

declare module "@engine-src/data/referenceData.js" {
  import type { CompanyProfile } from "@/features/profile/types/profile.types";
  export const DEMO_PROFILE: CompanyProfile;
}
