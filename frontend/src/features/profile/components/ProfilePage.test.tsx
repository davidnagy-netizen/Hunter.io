import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { metaApi } from "@/shared/api/meta.api";
import type { MetaResponse } from "@/shared/types/reference.types";
import { profileApi } from "../api/profile.api";
import { ProfilePage } from "./ProfilePage";

vi.mock("@/features/authentication/hooks/useAuth", () => ({
  useIsAuthenticated: vi.fn(),
}));

vi.mock("../api/profile.api", () => ({
  profileApi: {
    get: vi.fn(),
    save: vi.fn(),
    loadDemo: vi.fn(),
    history: vi.fn(),
    restore: vi.fn(),
  },
}));

vi.mock("@/shared/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));

const META = {
  catalog: null,
  reference: { regions: [], industries: [], goals: [], revBands: [], orgTypes: [] },
  labels: { programmes: {}, actions: {} },
  optionalProfileFields: [],
  today: "2026-09-24",
} as MetaResponse;

describe("ProfilePage", () => {
  it("shows the signed-in company's saved profile", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(metaApi.get).mockResolvedValue(META);
    vi.mocked(profileApi.get).mockResolvedValue({
      profile: {
        company: "Alfa Gyártó Kft.",
        employees: 28,
        county: "Pest",
        industryId: "manuf",
        closed_business_years: 4,
        goals: [],
        investment_value: 30_000_000,
        funding_pref: [],
      },
      answers: {},
      saved: [],
      demoProfile: {} as never,
      versions: 1,
    });
    vi.mocked(profileApi.history).mockResolvedValue({ current: null, versions: [], activity: [] });

    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText("Alfa Gyártó Kft.")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
  });
});
