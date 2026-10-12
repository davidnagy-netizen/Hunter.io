import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useCurrentUser, useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import type { AuthUser } from "@/features/authentication/types/auth.types";
import { metaApi } from "@/api/meta.api";
import type { MetaResponse } from "@/types/reference.types";
import { profileApi } from "@/features/profile/api/profile.api";
import { useUiStore } from "@/store/uiStore";
import { ProfilePage } from "@/pages/profile/ProfilePage";

vi.mock("@/features/authentication/hooks/useAuth", () => ({
  useIsAuthenticated: vi.fn(),
  useCurrentUser: vi.fn(),
}));

vi.mock("@/features/profile/api/profile.api", () => ({
  profileApi: {
    get: vi.fn(),
    save: vi.fn(),
    loadDemo: vi.fn(),
    history: vi.fn(),
    restore: vi.fn(),
    switchTo: vi.fn(),
  },
}));

vi.mock("@/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));

const META = {
  catalog: null,
  reference: { regions: [], industries: [], goals: [], revBands: [], orgTypes: [] },
  labels: { programmes: {}, actions: {} },
  optionalProfileFields: [],
  today: "2026-09-24",
} as MetaResponse;

const account = (companies: AuthUser["companies"], profileLimit = 2) => ({ companies, profileLimit }) as AuthUser;

beforeEach(() => {
  useUiStore.getState().setLang("hu");
  vi.mocked(useIsAuthenticated).mockReturnValue(true);
  vi.mocked(useCurrentUser).mockReturnValue(account([]));
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
  vi.mocked(profileApi.switchTo).mockReset().mockResolvedValue({ success: true });
});

describe("ProfilePage", () => {
  it("shows the signed-in company's saved profile", async () => {
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText("Alfa Gyártó Kft.")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
  });

  it("lists the account's companies, switches to another, and offers to add one under the limit", async () => {
    vi.mocked(useCurrentUser).mockReturnValue(account([
      { id: "1", name: "Első Kft.", active: true },
      { id: "2", name: "Második Bt.", active: false },
    ], 3));
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    expect(screen.getByText("2 / 3 cégprofil. A Fundor mindig az aktív cégre pontozza a felhívásokat.")).toBeInTheDocument();
    expect(screen.getByText("Első Kft.").closest("li")).toHaveTextContent("Aktív");
    await user.click(screen.getByRole("button", { name: "Váltás erre" }));
    expect(profileApi.switchTo).toHaveBeenCalledWith("2");
    expect(screen.getByRole("link", { name: "Új cég hozzáadása" })).toHaveAttribute("href", "/onboarding?new=1");
  });

  it("explains the paid unlock instead of adding a company at the limit", () => {
    vi.mocked(useCurrentUser).mockReturnValue(account([
      { id: "1", name: "Első Kft.", active: true },
      { id: "2", name: "Második Bt.", active: false },
    ]));
    renderWithProviders(<ProfilePage />);

    expect(screen.queryByRole("link", { name: "Új cég hozzáadása" })).not.toBeInTheDocument();
    expect(screen.getByText(/minden további egyszeri 3000 Ft/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+36 30 508 0569" })).toHaveAttribute("href", "tel:+36305080569");
  });
});
