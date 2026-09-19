import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import type { MeResponse } from "@/features/authentication/types/auth.types";
import { RequireAdmin } from "./RequireAdmin";

vi.mock("@/features/authentication/api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));

const me = (user: { role: "admin" | "user" } | null) =>
  vi.mocked(authApi.me).mockResolvedValue({ user, entitlements: { tier: "anonymous" }, plans: [], adminSeed: {} } as unknown as MeResponse);

function renderGuarded() {
  return renderWithProviders(
    <Routes>
      <Route path="/admin" element={<RequireAdmin><p>the console</p></RequireAdmin>} />
      <Route path="/login" element={<p>login page</p>} />
      <Route path="/app" element={<p>the app</p>} />
    </Routes>,
    { route: "/admin" },
  );
}

beforeEach(() => {
  vi.mocked(authApi.me).mockReset();
});

describe("RequireAdmin", () => {
  it("lets an administrator in", async () => {
    me({ role: "admin" });
    renderGuarded();
    expect(await screen.findByText("the console")).toBeInTheDocument();
  });

  it("sends a visitor who isn't signed in to the login page", async () => {
    me(null);
    renderGuarded();
    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("the console")).not.toBeInTheDocument();
  });

  it("sends an ordinary account back to the app", async () => {
    me({ role: "user" });
    renderGuarded();
    expect(await screen.findByText("the app")).toBeInTheDocument();
    expect(screen.queryByText("the console")).not.toBeInTheDocument();
  });

  it("shows nothing — neither the console nor a redirect — while the session is still loading", () => {
    vi.mocked(authApi.me).mockReturnValue(new Promise(() => {}));
    renderGuarded();
    expect(screen.queryByText("the console")).not.toBeInTheDocument();
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });
});
