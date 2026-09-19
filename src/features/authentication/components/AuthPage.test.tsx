import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "../api/auth.api";
import type { AuthUser, MeResponse } from "../types/auth.types";
import { AuthPage } from "./AuthPage";

vi.mock("../api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));

const ANONYMOUS = { user: null, entitlements: { tier: "anonymous" }, plans: [], adminSeed: { usingDefaultPassword: false, username: "admin" } } as unknown as MeResponse;

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/app" element={<p>the app</p>} />
      <Route path="/admin" element={<p>the console</p>} />
    </Routes>,
    { route: "/login" },
  );
}

async function signIn(role: AuthUser["role"]) {
  vi.mocked(authApi.login).mockResolvedValue({ success: true, user: { role, username: "someone" } as AuthUser });
  const user = userEvent.setup();
  renderLogin();
  await user.type(screen.getByLabelText(/felhasználónév|username/i), "someone");
  await user.type(screen.getByLabelText(/jelszó|password/i), "secret123");
  await user.click(screen.getByRole("button", { name: /^belépés$|^sign in$/i }));
}

beforeEach(() => {
  vi.mocked(authApi.me).mockResolvedValue(ANONYMOUS);
});

describe("AuthPage after signing in", () => {
  it("sends an administrator to the console", async () => {
    await signIn("admin");
    expect(await screen.findByText("the console")).toBeInTheDocument();
  });

  it("sends everyone else to the app", async () => {
    await signIn("user");
    expect(await screen.findByText("the app")).toBeInTheDocument();
  });
});
