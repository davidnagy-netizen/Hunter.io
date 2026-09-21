import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import { useCurrentUser, useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { useLocalProfileStore } from "@/features/profile/store/localProfileStore";
import { profileApi } from "@/features/profile/api/profile.api";
import { LandingPage } from "./LandingPage";

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

describe("LandingPage", () => {
  it("leads with the pitch and offers the free assessment and account creation", () => {
    renderLanding();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/ne te keresd a pályázatot|don't go looking for grants/i);
    expect(screen.getByRole("link", { name: /megnézem, mire vagyok jogosult|see what i'm eligible for/i })).toHaveAttribute("href", "/assess");
    expect(screen.getByRole("link", { name: /cégfiók létrehozása|create a company account/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /^belépés$|^sign in$/i })).toHaveAttribute("href", "/login");
  });

  it("carries the hero image with alt text, and the worked example", () => {
    renderLanding();
    expect(screen.getByRole("img", { name: /vállalati csapat|corporate team/i })).toHaveAttribute("src", "/hero.jpg");
    expect(screen.getAllByText(/GINOP/).length).toBeGreaterThan(0);
    expect(screen.getByText("549")).toBeInTheDocument();
  });

  it("offers every section's content: how it works, sources and the price", () => {
    renderLanding();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4);
    // The monthly price is stated in the heading and again in the price box.
    expect(screen.getAllByText(/5\s?990|5,990/).length).toBeGreaterThanOrEqual(2);
  });

  it("for an anonymous visitor who already built a profile, offers 'open the app' instead of trapping them", () => {
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    renderLanding();
    expect(screen.getByRole("link", { name: /az alkalmazás megnyitása|open the app/i })).toHaveAttribute("href", "/app");
    expect(screen.queryByRole("link", { name: /^belépés$|^sign in$/i })).not.toBeInTheDocument();
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
