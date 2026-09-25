import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import { profileApi } from "@/features/profile/api/profile.api";
import type { MeResponse } from "@/features/authentication/types/auth.types";
import { GridIcon } from "@/components";
import type { NavItem } from "@/types/navigation.types";
import "@/features/admin/i18n";
import { AppShell } from "./AppShell";

vi.mock("@/features/authentication/api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));
vi.mock("@/features/profile/api/profile.api", () => ({ profileApi: { get: vi.fn(), save: vi.fn(), loadDemo: vi.fn(), history: vi.fn(), restore: vi.fn() } }));

const NAV: NavItem[] = [
  { to: "/admin", labelKey: "nav.overview", namespace: "admin", icon: GridIcon, end: true },
  { to: "/admin/users", labelKey: "nav.users", namespace: "admin", icon: GridIcon },
];

const me = (role: "admin" | "user") =>
  vi.mocked(authApi.me).mockResolvedValue({
    user: { role, username: "someone", company: null },
    entitlements: { tier: role === "admin" ? "admin" : "registered" },
    plans: [],
    adminSeed: {},
  } as unknown as MeResponse);

function renderShell(workspace: "app" | "admin") {
  return renderWithProviders(
    <Routes>
      <Route element={<AppShell nav={NAV} workspace={workspace} />}>
        <Route path="/admin" element={<p>page body</p>} />
      </Route>
    </Routes>,
    { route: "/admin" },
  );
}

beforeEach(() => {
  vi.mocked(profileApi.get).mockResolvedValue({ profile: null, answers: {}, saved: [], demoProfile: {} as never, versions: 0 });
});

function renderWithBadgedItem() {
  const Badge = () => <span>BADGE</span>;
  const nav: NavItem[] = [{ to: "/admin", labelKey: "nav.overview", shortLabelKey: "nav.users", namespace: "admin", icon: GridIcon, end: true, badge: Badge }];
  return renderWithProviders(
    <Routes>
      <Route element={<AppShell nav={nav} workspace="admin" />}>
        <Route path="/admin" element={<p>page body</p>} />
      </Route>
    </Routes>,
    { route: "/admin" },
  );
}

describe("AppShell", () => {
  it("renders exactly the nav entries it is given, and the routed page", async () => {
    me("admin");
    renderShell("admin");
    expect(await screen.findByText("page body")).toBeInTheDocument();
    // once in the sidebar and once in the bottom bar
    expect(screen.getAllByRole("link", { name: /áttekintés|overview/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /felhasználók|users/i })).toHaveLength(2);
  });

  it("gives an administrator a switch between the client view and the admin console", async () => {
    me("admin");
    renderShell("admin");
    const group = await screen.findByRole("group", { name: /munkaterület|workspace/i });
    expect(within(group).getByRole("link", { name: /ügyfélnézet|client view/i })).toHaveAttribute("href", "/app");
    expect(within(group).getByRole("link", { name: /^admin$/i })).toHaveAttribute("href", "/admin");
    expect(screen.getByText(/fiókok és előfizetések kezelése|managing accounts and subscriptions/i)).toBeInTheDocument();
  });

  it("goes to the company profile when the account block is clicked", async () => {
    me("user");
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<AppShell nav={NAV} workspace="app" />}>
          <Route path="/admin" element={<p>page body</p>} />
          <Route path="/app/profile" element={<p>profile page</p>} />
        </Route>
      </Routes>,
      { route: "/admin" },
    );
    await screen.findByText("page body");

    await user.click(await screen.findByText("someone"));

    expect(await screen.findByText("profile page")).toBeInTheDocument();
  });

  it("does not show the switch to anyone else", async () => {
    me("user");
    renderShell("app");
    await screen.findByText("page body");
    expect(screen.queryByRole("group", { name: /munkaterület|workspace/i })).not.toBeInTheDocument();
  });

  it("decorates a nav item with its badge in the sidebar only", async () => {
    me("admin");
    renderWithBadgedItem();
    await screen.findByText("page body");
    expect(screen.getAllByText("BADGE")).toHaveLength(1);
  });

  it("uses an item's short label in the bottom bar and the full one in the sidebar", async () => {
    me("admin");
    renderWithBadgedItem();
    await screen.findByText("page body");
    const links = screen.getAllByRole("link", { name: /áttekintés|overview|felhasználók|users/i });
    const texts = links.map((l) => l.textContent);
    expect(texts.some((t) => /áttekintés|overview/i.test(t ?? ""))).toBe(true);
    expect(texts.some((t) => /^(felhasználók|users)$/i.test(t ?? ""))).toBe(true);
  });
});
