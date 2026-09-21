import { describe, expect, it } from "vitest";
import { applyLinks, isCuratedReference } from "./applyLinks";

describe("applyLinks", () => {
  it("passes through only the links the portal published", () => {
    const links = applyLinks({ sourceUrl: "https://ec.europa.eu/topic", submissionUrl: null, sourceSystem: "EU_FUNDING_TENDERS" });
    expect(links.official).toBe("https://ec.europa.eu/topic");
    expect(links.submit).toBeNull();
  });

  it("points EU calls at the EU portal and everything else at palyazat.gov.hu", () => {
    expect(applyLinks({ sourceSystem: "EU_FUNDING_TENDERS" }).portal).toContain("ec.europa.eu");
    expect(applyLinks({ sourceSystem: "HU_NATIONAL" }).portal).toContain("palyazat.gov.hu");
  });

  it("treats a call with no official page and no submission link as a curated reference", () => {
    expect(isCuratedReference(applyLinks({}))).toBe(true);
    expect(isCuratedReference(applyLinks({ submissionUrl: "https://x" }))).toBe(false);
  });
});
