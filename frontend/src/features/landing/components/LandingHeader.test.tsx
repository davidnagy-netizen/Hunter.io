import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/shared/hooks/useAuth";
import { useLocalProfileStore } from "@/shared/store/localProfileStore";
import { DEMO_PROFILE } from "@/shared/data/demoProfile";
import { LandingHeader } from "./LandingHeader";

vi.mock("@/shared/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn() }));

describe("LandingHeader", () => {
  it("offers sign in and the free-assessment link for a visitor with no profile yet", () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    renderWithProviders(<LandingHeader />);
    expect(screen.getByRole("link", { name: /^belépés$|^sign in$/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /mire vagyok jogosult|what am i eligible for/i })).toHaveAttribute("href", "/assess");
  });

  it("offers 'open the app' instead, once a profile exists — never traps the visitor away from it", () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    renderWithProviders(<LandingHeader />);
    expect(screen.getByRole("link", { name: /az alkalmazás megnyitása|open the app/i })).toHaveAttribute("href", "/app");
    expect(screen.queryByRole("link", { name: /^belépés$|^sign in$/i })).not.toBeInTheDocument();
    useLocalProfileStore.getState().clear();
  });
});
