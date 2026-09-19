import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, createTestQueryClient } from "@/test/renderWithProviders";
import { metaKeys } from "@/shared/api/meta.queries";
import { opportunitiesKeys } from "@/features/opportunities/api/opportunities.queries";
import { adminApi } from "../api/admin.api";
import { makeOverview } from "../testFixtures";
import { SystemPage } from "./SystemPage";

vi.mock("../api/admin.api", () => ({
  adminApi: { overview: vi.fn(), users: vi.fn(), history: vi.fn(), grant: vi.fn(), revoke: vi.fn(), patchUser: vi.fn(), refreshCatalog: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(adminApi.refreshCatalog).mockReset();
  vi.mocked(adminApi.overview).mockResolvedValue(makeOverview());
});

describe("SystemPage", () => {
  it("reports the catalog's size, source and exchange rate", async () => {
    renderWithProviders(<SystemPage />);
    expect(await screen.findByText("621")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("live-refresh")).toBeInTheDocument();
    expect(screen.getByText("1 EUR = 364.28 HUF")).toBeInTheDocument();
  });

  it("shows the refresher's state, and a dash for what has never happened", async () => {
    renderWithProviders(<SystemPage />);
    await screen.findByText("621");
    expect(screen.getByText(/bekapcsolva|enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/6 ó|6 h/)).toBeInTheDocument();
    expect(screen.getByText("0 / 0")).toBeInTheDocument();
  });

  it("surfaces the last refresh error", async () => {
    vi.mocked(adminApi.overview).mockResolvedValue(
      makeOverview({ system: { ...makeOverview().system, refresh: { enabled: true, lastError: { message: "portal timed out", at: "2026-09-19T10:00:00.000Z" } } } }),
    );
    renderWithProviders(<SystemPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("portal timed out");
  });

  it("refreshes the catalog on demand and reports how many calls it now holds", async () => {
    vi.mocked(adminApi.refreshCatalog).mockResolvedValue({ ok: true, total: 546, status: { enabled: true } });
    const user = userEvent.setup();
    renderWithProviders(<SystemPage />);

    await user.click(await screen.findByRole("button", { name: /frissítés most|refresh now/i }));
    expect(await screen.findByRole("status")).toHaveTextContent("546");
  });

  it("drops every cached catalog-derived result after a refresh", async () => {
    vi.mocked(adminApi.refreshCatalog).mockResolvedValue({ ok: true, total: 546, status: { enabled: true } });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([...opportunitiesKeys.all, "search", "x"], { total: 1 });
    queryClient.setQueryData(metaKeys.all, { today: "2026-09-19" });
    const user = userEvent.setup();
    renderWithProviders(<SystemPage />, { queryClient });

    await user.click(await screen.findByRole("button", { name: /frissítés most|refresh now/i }));

    await waitFor(() => {
      expect(queryClient.getQueryState([...opportunitiesKeys.all, "search", "x"])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(metaKeys.all)?.isInvalidated).toBe(true);
    });
  });

  it("disables the button while a refresh runs, so it can't be double-fired", async () => {
    vi.mocked(adminApi.refreshCatalog).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<SystemPage />);

    await user.click(await screen.findByRole("button", { name: /frissítés most|refresh now/i }));
    expect(await screen.findByRole("button", { name: /frissítés folyamatban|refreshing/i })).toBeDisabled();
  });

  it("shows why a refresh failed", async () => {
    vi.mocked(adminApi.refreshCatalog).mockRejectedValue({ isAxiosError: true, message: "Request failed", response: { status: 502, data: { error: "portal down" } } });
    const user = userEvent.setup();
    renderWithProviders(<SystemPage />);

    await user.click(await screen.findByRole("button", { name: /frissítés most|refresh now/i }));
    expect(await screen.findByText("portal down")).toBeInTheDocument();
  });
});
