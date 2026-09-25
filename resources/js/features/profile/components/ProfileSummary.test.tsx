import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { metaApi } from "@/api/meta.api";
import type { MetaResponse } from "@/types/reference.types";
import type { CompanyProfile } from "../types/profile.types";
import { ProfileSummary } from "./ProfileSummary";

vi.mock("@/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));

const META = {
  catalog: null,
  reference: {
    regions: [{ code: "HU12", name: "Pest megye", counties: ["Pest"] }],
    industries: [{ id: "manuf", label: "Gyártás / feldolgozóipar", teaor: "10" }],
    goals: [{ id: "digitalization", label: "Digitalizáció", label_en: "Digitalisation" }],
    revBands: [],
    orgTypes: [{ id: "sme", label_hu: "KKV", label_en: "SME" }],
  },
  labels: { programmes: {}, actions: {} },
  optionalProfileFields: [],
  today: "2026-09-24",
} as MetaResponse;

const FULL_PROFILE: CompanyProfile = {
  company: "Alfa Gyártó Kft.",
  taxNumber: "12345678-1-42",
  employees: 28,
  county: "Pest",
  industryId: "manuf",
  closed_business_years: 4,
  revBand: "500 M–1 Mrd Ft",
  goals: ["digitalization"],
  investment_value: 30_000_000,
  projectName: "ERP bevezetés",
  funding_pref: ["non_refundable"],
  orgType: "sme",
  consortium_ready: true,
  eu_experience: false,
};

describe("ProfileSummary", () => {
  it("shows every field, resolving ids to their reference labels", async () => {
    vi.mocked(metaApi.get).mockResolvedValue(META);
    renderWithProviders(<ProfileSummary profile={FULL_PROFILE} />);

    expect(screen.getByText("Alfa Gyártó Kft.")).toBeInTheDocument();
    expect(screen.getByText("12345678-1-42")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("500 M–1 Mrd Ft")).toBeInTheDocument();
    expect(screen.getByText("ERP bevezetés")).toBeInTheDocument();
    expect(screen.getByText(/30 M Ft|30M HUF/)).toBeInTheDocument();
    expect(screen.getByText(/van vagy építhető|have or can build/i)).toBeInTheDocument();

    // Meta-dependent lookups (region/industry/orgType names) resolve after the reference
    // data loads — wait for the first, then the rest have already landed in the same render.
    expect(await screen.findByText(/Pest — Pest megye/)).toBeInTheDocument();
    expect(screen.getByText(/gyártás|manufacturing/i)).toBeInTheDocument();
    expect(screen.getByText(/digitalizáció|digitalisation/i)).toBeInTheDocument();
    expect(screen.getByText(/^kkv$|^sme$/i)).toBeInTheDocument();
  });

  it("omits a field the profile never set instead of showing a placeholder", () => {
    vi.mocked(metaApi.get).mockResolvedValue(META);
    const minimal: CompanyProfile = {
      company: "Beta Kft.",
      employees: 5,
      county: "Pest",
      industryId: "manuf",
      closed_business_years: 0,
      goals: [],
      investment_value: 0,
      funding_pref: [],
    };
    renderWithProviders(<ProfileSummary profile={minimal} />);

    expect(screen.getByText("Beta Kft.")).toBeInTheDocument();
    expect(screen.queryByText(/adószám|tax number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tervezett projektérték|planned project value/i)).not.toBeInTheDocument();
  });
});
