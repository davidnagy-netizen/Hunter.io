import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useOnboardingDraftStore } from "@/features/profile/store/onboardingDraftStore";
import { authApi } from "../api/auth.api";
import { taxpayerApi } from "../api/taxpayer.api";
import type { AuthUser, MeResponse } from "../types/auth.types";
import { AuthPage } from "./AuthPage";

vi.mock("../api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));
vi.mock("../api/taxpayer.api", () => ({ taxpayerApi: { lookup: vi.fn() } }));

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

describe("AuthPage after registering", () => {
  it("hands the NAV-confirmed company to onboarding, then goes to the app", async () => {
    vi.mocked(taxpayerApi.lookup).mockResolvedValue({
      taxNumber: "12345674-2-42", companyName: "Alfa Gyártó és Kereskedelmi Kft.", shortName: "Alfa", postalCode: null, city: null,
      streetAddress: null, fullAddress: "2100 Gödöllő", status: "VALID", incorporationDate: null,
    });
    vi.mocked(authApi.register).mockResolvedValue({ success: true, user: { role: "user", username: "info" } as AuthUser });
    useOnboardingDraftStore.getState().setDraft({ employees: 12 });
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/app" element={<p>the app</p>} />
      </Routes>,
      { route: "/register" },
    );

    await user.type(screen.getByLabelText(/e-mail|email/i), "info@alfa.hu");
    await user.type(screen.getByLabelText(/jelszó|password/i), "s3cret1");
    await user.type(screen.getByLabelText(/adószám|tax number/i), "12345674-2-42");
    await user.click(screen.getByRole("checkbox", { name: /általános szerződési|terms of service/i }));
    await user.click(screen.getByRole("button", { name: /cég keresése|find my company/i }));
    await user.click(await screen.findByRole("button", { name: /ez az én cégem|this is my company/i }));

    expect(await screen.findByText("the app")).toBeInTheDocument();
    // What the assessment already collected is kept; the verified company is added to it.
    expect(useOnboardingDraftStore.getState().draft).toEqual({
      employees: 12, company: "Alfa Gyártó és Kereskedelmi Kft.", taxNumber: "12345674-2-42",
    });
    useOnboardingDraftStore.getState().clear();
  });
});
