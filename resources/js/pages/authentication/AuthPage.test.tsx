import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import type { AuthUser, MeResponse } from "@/features/authentication/types/auth.types";
import type { RegisterFormProps } from "@/features/authentication/components/RegisterForm";
import { AuthPage } from "@/pages/authentication/AuthPage";

vi.mock("@/features/authentication/api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));
// Form behavior is covered separately; this test checks the page's navigation contract.
vi.mock("@/features/authentication/components/RegisterForm", () => ({ RegisterForm: ({ onSuccess }: RegisterFormProps) => <button onClick={() => onSuccess?.({ taxNumber: "12345676", companyName: "Company", shortName: "Company", postalCode: null, city: null, streetAddress: null, fullAddress: "", status: "VALID", incorporationDate: null })}>Complete registration</button> }));
beforeEach(() => { vi.mocked(authApi.me).mockResolvedValue({ user: null, entitlements: { tier: "anonymous" }, plans: [] } as unknown as MeResponse); });

describe("AuthPage navigation", () => {
  it.each(["admin", "user"] as const)("routes %s login to its workspace", async role => {
    vi.mocked(authApi.login).mockResolvedValue({ success: true, user: { role } as AuthUser });
    const user = userEvent.setup();
    renderWithProviders(<Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/app" element={<p>app workspace</p>} />
      <Route path="/admin" element={<p>admin workspace</p>} />
    </Routes>, { route: "/login" });
    await user.type(screen.getByLabelText(/felhasználónév|username/i), "someone");
    await user.type(screen.getByLabelText(/jelszó|password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^belépés$|^sign in$/i }));
    expect(await screen.findByText(role === "admin" ? "admin workspace" : "app workspace")).toBeInTheDocument();
  });
  it("routes completed registration to email verification", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Routes>
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/verify-email" element={<p>email verification</p>} />
    </Routes>, { route: "/register" });
    await user.click(screen.getByRole("button", { name: "Complete registration" }));
    expect(await screen.findByText("email verification")).toBeInTheDocument();
  });
});
