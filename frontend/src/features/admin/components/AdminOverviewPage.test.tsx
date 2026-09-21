import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { adminApi } from "../api/admin.api";
import { makeOverview, makeUser } from "../testFixtures";
import { AdminOverviewPage } from "./AdminOverviewPage";

vi.mock("../api/admin.api", () => ({
  adminApi: { overview: vi.fn(), users: vi.fn(), history: vi.fn(), grant: vi.fn(), revoke: vi.fn(), patchUser: vi.fn(), refreshCatalog: vi.fn() },
}));

const waiting = makeUser({ id: "w1", username: "anna", company: "Anna Bt." });
const expiring = makeUser({
  id: "e1",
  username: "bela",
  subscription: { status: "active", plan: "quarterly", active: true, daysLeft: 6 },
});

beforeEach(() => {
  vi.mocked(adminApi.grant).mockReset();
  vi.mocked(adminApi.overview).mockResolvedValue(
    makeOverview({
      awaitingAccess: [waiting],
      expiringSoon: [{ ...expiring, daysLeft: 6 }],
      recentSignups: [waiting],
      activity: [{ at: "2026-09-19T10:00:00.000Z", type: "account.login", username: "anna" }],
    }),
  );
});

describe("AdminOverviewPage", () => {
  it("shows the headline numbers", async () => {
    renderWithProviders(<AdminOverviewPage />);
    const users = (await screen.findByText(/^felhasználó$|^users$/i)).parentElement!;
    expect(within(users).getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/^élő munkamenet$|^live sessions$/i).parentElement).toHaveTextContent("4");
  });

  it("lists who is waiting for access and grants a trial in one click", async () => {
    vi.mocked(adminApi.grant).mockResolvedValue({ success: true, user: waiting });
    const user = userEvent.setup();
    renderWithProviders(<AdminOverviewPage />);

    const card = (await screen.findByRole("heading", { name: /^hozzáférésre vár$|^awaiting access$/i })).closest("div")!.parentElement!;
    await user.click(within(card).getByRole("button", { name: /^próba$|^trial$/i }));

    await waitFor(() => expect(adminApi.grant).toHaveBeenCalledWith({ userId: "w1", planId: "trial" }));
    expect(await screen.findByRole("status")).toHaveTextContent("anna");
  });

  it("extends an expiring subscription on the plan it already has", async () => {
    vi.mocked(adminApi.grant).mockResolvedValue({ success: true, user: expiring });
    const user = userEvent.setup();
    renderWithProviders(<AdminOverviewPage />);

    await user.click(await screen.findByRole("button", { name: /hosszabbítás|extend/i }));
    await waitFor(() => expect(adminApi.grant).toHaveBeenCalledWith({ userId: "e1", planId: "quarterly" }));
  });

  it("refetches the overview after a grant so the lists update", async () => {
    vi.mocked(adminApi.grant).mockResolvedValue({ success: true, user: waiting });
    const user = userEvent.setup();
    renderWithProviders(<AdminOverviewPage />);

    await user.click(await screen.findByRole("button", { name: /^havi$|^monthly$/i }));
    await waitFor(() => expect(adminApi.overview).toHaveBeenCalledTimes(2));
  });

  it("reports a failed grant using the server's error code", async () => {
    vi.mocked(adminApi.grant).mockRejectedValue({ isAxiosError: true, message: "x", response: { status: 404, data: { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" } } });
    const user = userEvent.setup();
    renderWithProviders(<AdminOverviewPage />);

    await user.click(await screen.findByRole("button", { name: /^havi$|^monthly$/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("says so when nothing needs attention", async () => {
    vi.mocked(adminApi.overview).mockResolvedValue(makeOverview({ byPlan: {} }));
    renderWithProviders(<AdminOverviewPage />);
    expect(await screen.findByText(/mindenki hozzáféréssel rendelkezik|everyone has access/i)).toBeInTheDocument();
    expect(screen.getByText(/nincs aktív előfizetés|no active subscriptions/i)).toBeInTheDocument();
  });

  it("shows the activity log with readable event names", async () => {
    renderWithProviders(<AdminOverviewPage />);
    expect(await screen.findByText(/belépés|signed in/i, { selector: "span" })).toBeInTheDocument();
  });
});
