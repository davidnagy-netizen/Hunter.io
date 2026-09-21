import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { adminApi } from "../api/admin.api";
import { PLANS, makeAdminUser, makeUser } from "../testFixtures";
import { UsersPage } from "./UsersPage";

vi.mock("../api/admin.api", () => ({
  adminApi: { overview: vi.fn(), users: vi.fn(), history: vi.fn(), grant: vi.fn(), revoke: vi.fn(), patchUser: vi.fn(), refreshCatalog: vi.fn() },
}));

const kata = makeAdminUser({ id: "u1", username: "kata", company: "Kata Kft.", email: "kata@example.com", profileVersions: 2 });
const subscriber = makeAdminUser({
  id: "u2",
  username: "sandor",
  subscription: { status: "active", plan: "monthly", validUntil: "2026-10-10T00:00:00.000Z", grantedBy: "admin", active: true, daysLeft: 21 },
});
const boss = makeAdminUser({ id: "u3", username: "admin", role: "admin" });

function cardOf(name: string) {
  return screen.getByText(name, { selector: "b" }).closest("div.rounded-lg") as HTMLElement;
}

beforeEach(() => {
  vi.mocked(adminApi.grant).mockReset();
  vi.mocked(adminApi.revoke).mockReset();
  vi.mocked(adminApi.patchUser).mockReset();
  vi.mocked(adminApi.users).mockResolvedValue({
    stats: { users: 3, admins: 1, activeSubscriptions: 1, sessions: 2, leads: 0 },
    plans: PLANS,
    users: [kata, subscriber, boss],
  });
});

describe("UsersPage", () => {
  it("lists every account with its company, email and profile versions", async () => {
    renderWithProviders(<UsersPage />);
    const card = within(await screen.findByText("kata", { selector: "b" }).then(() => cardOf("kata")));
    expect(card.getByText(/Kata Kft\..*kata@example\.com/)).toBeInTheDocument();
    expect(card.getByText(/2 profilverzió|2 profile versions/i)).toBeInTheDocument();
  });

  it("grants a plan for a custom number of days, with a note", async () => {
    vi.mocked(adminApi.grant).mockResolvedValue({ success: true, user: makeUser() });
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await screen.findByText("kata", { selector: "b" });
    const card = within(cardOf("kata"));

    await user.selectOptions(card.getByLabelText(/^csomag$|^plan$/i), "monthly");
    await user.type(card.getByLabelText(/^napok|^days/i), "45");
    await user.type(card.getByLabelText(/^megjegyzés|^note/i), "paid by transfer");
    await user.click(card.getByRole("button", { name: /hozzáférés megadása|grant access/i }));

    await waitFor(() =>
      expect(adminApi.grant).toHaveBeenCalledWith({ userId: "u1", planId: "monthly", days: 45, note: "paid by transfer" }),
    );
    expect(await card.findByText(/hozzáférés megadva|access granted/i)).toBeInTheDocument();
  });

  it("leaves days out entirely when the field is empty, so the plan's own length applies", async () => {
    vi.mocked(adminApi.grant).mockResolvedValue({ success: true, user: makeUser() });
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await screen.findByText("kata", { selector: "b" });

    await user.click(within(cardOf("kata")).getByRole("button", { name: /hozzáférés megadása|grant access/i }));
    await waitFor(() => expect(adminApi.grant).toHaveBeenCalledWith({ userId: "u1", planId: "trial", days: undefined, note: undefined }));
  });

  it("refuses a zero-day grant and never calls the server", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await screen.findByText("kata", { selector: "b" });
    const card = within(cardOf("kata"));

    await user.type(card.getByLabelText(/^napok|^days/i), "0");
    await user.click(card.getByRole("button", { name: /hozzáférés megadása|grant access/i }));

    expect(await card.findByText(/legalább 1|at least 1/i)).toBeInTheDocument();
    expect(adminApi.grant).not.toHaveBeenCalled();
  });

  it("offers 'revoke' only where there is an active subscription to revoke", async () => {
    vi.mocked(adminApi.revoke).mockResolvedValue({ success: true, user: makeUser() });
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await screen.findByText("kata", { selector: "b" });

    expect(within(cardOf("kata")).queryByRole("button", { name: /^visszavonás$|^revoke$/i })).not.toBeInTheDocument();
    await user.click(within(cardOf("sandor")).getByRole("button", { name: /^visszavonás$|^revoke$/i }));
    await waitFor(() => expect(adminApi.revoke).toHaveBeenCalledWith("u2"));
  });

  it("shows when a subscription runs until and who granted it", async () => {
    renderWithProviders(<UsersPage />);
    await screen.findByText("sandor", { selector: "b" });
    const card = within(cardOf("sandor"));
    expect(card.getByText(/kiosztotta: admin|granted by: admin/i)).toBeInTheDocument();
    expect(card.getByText(/eddig|until/i)).toBeInTheDocument();
  });

  it("disables and re-enables an account", async () => {
    vi.mocked(adminApi.patchUser).mockResolvedValue({ success: true, user: makeUser() });
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await screen.findByText("kata", { selector: "b" });

    await user.click(within(cardOf("kata")).getByRole("button", { name: /^letiltás$|^disable$/i }));
    await waitFor(() => expect(adminApi.patchUser).toHaveBeenCalledWith({ userId: "u1", disabled: true }));
  });

  it("never offers to disable an administrator", async () => {
    renderWithProviders(<UsersPage />);
    await screen.findByText("admin", { selector: "b" });
    expect(within(cardOf("admin")).queryByRole("button", { name: /^letiltás$|^disable$/i })).not.toBeInTheDocument();
    expect(within(cardOf("admin")).getByText("admin", { selector: "span" })).toBeInTheDocument();
  });

  it("links each account to its history page", async () => {
    renderWithProviders(<UsersPage />);
    await screen.findByText("kata", { selector: "b" });
    expect(within(cardOf("kata")).getByRole("link", { name: /előzmények|history/i })).toHaveAttribute("href", "/admin/users/u1");
  });
});
