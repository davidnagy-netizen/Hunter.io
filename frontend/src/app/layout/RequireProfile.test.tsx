import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/shared/api/auth.api";
import { useIsAuthenticated } from "@/shared/hooks/useAuth";
import { DEMO_PROFILE } from "@/shared/data/demoProfile";
import { useLocalProfileStore } from "@/shared/store/localProfileStore";
import { RequireProfile } from "./RequireProfile";

vi.mock("@/shared/api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));
vi.mock("@/shared/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn() }));

afterEach(() => useLocalProfileStore.getState().clear());

function renderGuarded() {
  vi.mocked(authApi.me).mockResolvedValue({ user: null, entitlements: { tier: "anonymous" }, plans: [], adminSeed: {} } as never);
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  return renderWithProviders(
    <Routes>
      <Route path="/app" element={<RequireProfile><p>the app</p></RequireProfile>} />
      <Route path="/onboarding" element={<p>onboarding</p>} />
    </Routes>,
    { route: "/app" },
  );
}

describe("RequireProfile", () => {
  it("sends a visitor without a company profile to onboarding", async () => {
    renderGuarded();
    expect(await screen.findByText("onboarding")).toBeInTheDocument();
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
  });

  it("lets a visitor with a profile through", async () => {
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    renderGuarded();
    expect(await screen.findByText("the app")).toBeInTheDocument();
  });
});
