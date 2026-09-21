import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { profileApi } from "../api/profile.api";
import { ProfileHistoryPanel } from "./ProfileHistoryPanel";

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

describe("ProfileHistoryPanel", () => {
  it("tells an anonymous visitor that history needs an account, without calling the API", () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    renderWithProviders(<ProfileHistoryPanel />);

    expect(screen.getByText(/csak bejelentkezve érhetők el|only available when signed in/i)).toBeInTheDocument();
    expect(profileApi.history).not.toHaveBeenCalled();
  });

  it("lists versions and lets a signed-in account restore one", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(profileApi.history).mockResolvedValue({
      current: null,
      versions: [
        { version: 2, at: "2026-09-19T10:00:00.000Z", source: "profile form", changed: [{ field: "employees", from: 28, to: 45 }] },
        { version: 1, at: "2026-09-18T10:00:00.000Z", source: "profile form", changed: [] },
      ],
      activity: [],
    });
    vi.mocked(profileApi.restore).mockResolvedValue({ success: true, profile: {} as never, versions: [] });
    const user = userEvent.setup();
    renderWithProviders(<ProfileHistoryPanel />);

    expect(await screen.findByText(/employees/i)).toBeInTheDocument();
    expect(screen.getByText(/28/)).toBeInTheDocument();
    expect(screen.getByText(/45/)).toBeInTheDocument();

    const restoreButtons = screen.getAllByRole("button", { name: /visszaállítás|restore/i });
    await user.click(restoreButtons[restoreButtons.length - 1]);

    await waitFor(() => expect(profileApi.restore).toHaveBeenCalledWith(1));
  });

  it("shows an empty state when there are no versions yet", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(profileApi.history).mockResolvedValue({ current: null, versions: [], activity: [] });
    renderWithProviders(<ProfileHistoryPanel />);

    expect(await screen.findByText(/még nincs mentett verzió|no versions saved yet/i)).toBeInTheDocument();
  });
});
