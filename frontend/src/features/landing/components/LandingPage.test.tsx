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

/**
 * A thin shell now that every section is its own component (see each
 * section's own test file for its content: `Hero`, `LandingHeader`,
 * `TrustStrip`, `ComparisonSection`, `HowItWorks`, `Sources`, `PriceTeaser`).
 * What belongs here is what only exists at the assembled-page level: every
 * section actually renders, in order, and the signed-in redirect guard.
 */
describe("LandingPage", () => {
  it("assembles every section, in order, for an anonymous visitor", () => {
    renderLanding();
    const headings = screen.getAllByRole("heading");
    const order = headings.map((h) => h.textContent);
    const indexOf = (pattern: RegExp) => order.findIndex((text) => pattern.test(text ?? ""));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/ne te keresd a pályázatot|don't go looking for grants/i);
    // palyazat.gov.hu appears once in TrustStrip and again in Sources' full list — both present is the point.
    expect(screen.getAllByText(/palyazat\.gov\.hu/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("549")).toBeInTheDocument(); // ComparisonSection
    expect(document.getElementById("how")).toBeInTheDocument(); // HowItWorks
    expect(screen.getAllByText(/kap\.gov\.hu/).length).toBeGreaterThanOrEqual(2); // TrustStrip + Sources
    expect(screen.getAllByText(/5\s?990|5,990/).length).toBeGreaterThanOrEqual(2); // PriceTeaser
    expect(screen.getByText(/mvp prototípus|mvp prototype/i)).toBeInTheDocument(); // LandingFooter

    // Sections stay in the intended attention → understanding+trust → mechanism → action order:
    // Comparison and Sources share the page's light chapter (the proof and where it comes from,
    // together); How it works sits in the closing dark chapter, right before the price/CTA — the
    // mechanism leading into action, not stranded between the worked example and its sources.
    const compareIdx = indexOf(/nem pályázatlista|not a grant list/i);
    const sourcesIdx = indexOf(/az adat onnan jön|the data comes from/i);
    const howIdx = indexOf(/három lépés|three steps/i);
    expect(compareIdx).toBeGreaterThan(-1);
    expect(sourcesIdx).toBeGreaterThan(compareIdx);
    expect(howIdx).toBeGreaterThan(sourcesIdx);
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
