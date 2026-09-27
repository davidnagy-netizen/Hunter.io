import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import { useCurrentUser, useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { useLocalProfileStore } from "@/features/profile/store/localProfileStore";
import { profileApi } from "@/features/profile/api/profile.api";
import { LandingPage } from "@/pages/landing/LandingPage";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn(), useCurrentUser: vi.fn() }));
vi.mock("@/features/authentication/api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));
vi.mock("@/features/profile/api/profile.api", () => ({ profileApi: { get: vi.fn(), save: vi.fn(), loadDemo: vi.fn(), history: vi.fn(), restore: vi.fn() } }));

const renderLanding = () =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<p>the app</p>} />
      <Route path="/admin" element={<p>the console</p>} />
    </Routes>,
  );

beforeEach(() => {
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  vi.mocked(useCurrentUser).mockReturnValue(null);
  vi.mocked(authApi.me).mockResolvedValue({ user: null, entitlements: { tier: "anonymous" }, plans: [], adminSeed: {} } as never);
});
afterEach(() => useLocalProfileStore.getState().clear());

/**
 * A thin shell now that every section is its own component (see each
 * section's own test file for its content: `Hero`, `LandingHeader`,
 * `TrustStrip`, `ComparisonSection`, `HowItWorks`, `Sources`, `PriceTeaser`).
 * What belongs here is what only exists at the assembled-page level: every
 * section actually renders, in order, and the signed-in redirect guard.
 */
describe("LandingPage", () => {
  it("renders login and register entrypoints for a visitor without a local profile", () => {
    renderLanding();
    expect(screen.getByRole("link", { name: /bejelentkezés|sign in/i })).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: /kezdés ingyen|start for free/i })[0]).toHaveAttribute("href", "/register");
  });

  it("renders an app link for an anonymous visitor who already created a local profile", () => {
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    renderLanding();
    expect(screen.getByRole("link", { name: /alkalmazás megnyitása|open the application/i })).toHaveAttribute("href", "/app");
    expect(screen.queryByRole("link", { name: /bejelentkezés|sign in/i })).not.toBeInTheDocument();
  });

  it("sends a signed-in account with a profile straight to its matches", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(useCurrentUser).mockReturnValue({ role: "user" } as never);
    vi.mocked(profileApi.get).mockResolvedValue({ profile: DEMO_PROFILE, answers: {}, saved: [], demoProfile: DEMO_PROFILE, versions: 1 });
    renderLanding();
    expect(await screen.findByText("the app")).toBeInTheDocument();
  });

  it("sends an administrator to the console, profile or not", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(useCurrentUser).mockReturnValue({ role: "admin" } as never);
    vi.mocked(profileApi.get).mockResolvedValue({ profile: null, answers: {}, saved: [], demoProfile: DEMO_PROFILE, versions: 0 });
    renderLanding();
    expect(await screen.findByText("the console")).toBeInTheDocument();
  });
});
