import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import { makeUser } from "@/features/admin/testFixtures";
import type { MeResponse } from "@/features/authentication/types/auth.types";
import { useUiStore } from "@/store/uiStore";
import { VerifyEmailPage } from "./VerifyEmailPage";

vi.mock("@/features/authentication/api/auth.api", () => ({
  authApi: { me: vi.fn(), verifyEmail: vi.fn(), logout: vi.fn() },
}));

const session = (emailVerified: boolean) => ({ user: makeUser({ email: "anna@ceg.hu", emailVerified }) }) as MeResponse;

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/app" element={<p>the app</p>} />
    </Routes>,
    { route: "/verify-email" },
  );
}

beforeEach(() => {
  useUiStore.getState().setLang("hu");
  vi.mocked(authApi.me).mockReset().mockResolvedValue(session(false));
  vi.mocked(authApi.verifyEmail).mockReset();
});

describe("VerifyEmailPage", () => {
  it("asks for the 6-digit code sent to the account's address, and opens the app once it's accepted", async () => {
    vi.mocked(authApi.verifyEmail).mockImplementation(async () => {
      vi.mocked(authApi.me).mockResolvedValue(session(true));
      return { success: true };
    });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText(/anna@ceg\.hu/)).toBeInTheDocument();
    const verify = screen.getByRole("button", { name: "Megerősítés" });
    expect(verify).toBeDisabled();
    await user.type(screen.getByLabelText("Megerősítő kód"), "04a2317");
    expect(screen.getByLabelText("Megerősítő kód")).toHaveValue("042317");
    await user.click(verify);

    expect(authApi.verifyEmail).toHaveBeenCalledWith("042317");
    expect(await screen.findByText("the app")).toBeInTheDocument();
  });

  it("says so when the code is wrong or expired", async () => {
    vi.mocked(authApi.verifyEmail).mockRejectedValue({ isAxiosError: true, response: { status: 422, data: { error: "x", code: "INVALID_CODE" } } });
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText("Megerősítő kód"), "000000");
    await user.click(screen.getByRole("button", { name: "Megerősítés" }));

    expect(await screen.findByText("A kód hibás vagy lejárt. Kérj új kódot.")).toBeInTheDocument();
  });
});
