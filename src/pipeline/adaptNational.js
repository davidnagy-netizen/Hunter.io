/**
 * Hungarian national calls -> the shape the rest of the system expects.
 *
 * Shared by the offline catalog builder and the live refresher so the two can
 * never drift. A real palyazat.gov.hu connector would replace the input to this
 * function and nothing else.
 */

export function adaptNationalCall(call) {
  return {
    ...call,
    sourceSystem: "HU_NATIONAL",
    sourceRef: call.source,
    sourceUrl: call.sourceUrl || null,
    curated: call.curated === true,
    programShort: "HU",
    status: "open",
    actionCode: null,
    actionLabel: call.program,
    consortium: { required: false, minPartners: 1, minCountries: 1 },
    applicantTypes: ["sme", "large"],
    smeFit: 1,
    adminBurden: call.highAdmin ? 0.8 : 0.4,
    awardsFunding: true,
    sectors: call.sectors || [],
    keywords: call.keywords || [],
    currency: "HUF",
    budget: {
      minContributionHuf: call.fundingMin ?? null,
      maxContributionHuf: call.fundingMax ?? null,
      minContributionEur: null,
      maxContributionEur: null,
      totalCallBudgetEur: null,
      expectedGrants: null,
    },
    hungary: { eligible: true, basis: "Hungarian national / EU cohesion programme", note: null },
    description: call.description || "",
  };
}
