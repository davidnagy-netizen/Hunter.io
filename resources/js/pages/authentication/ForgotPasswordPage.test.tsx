import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import { useUiStore } from "@/store/uiStore";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

vi.mock("@/features/authentication/api/auth.api", () => ({
  authApi: { me: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn() },
}));

beforeEach(() => {
  useUiStore.getState().setLang("hu");
  vi.mocked(authApi.forgotPassword).mockReset().mockResolvedValue({ success: true });
  vi.mocked(authApi.resetPassword).mockReset().mockResolvedValue({ success: true });
});

describe("ForgotPasswordPage", () => {
  it("sends a code to the address, then sets the new password with it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("E-mail"), "anna@ceg.hu");
    await user.click(screen.getByRole("button", { name: "Kód küldése" }));
    expect(authApi.forgotPassword).toHaveBeenCalledWith("anna@ceg.hu", "hu");
    expect(await screen.findByRole("status")).toHaveTextContent(/elküldtük a kódot/);

    await user.type(screen.getByLabelText("6 jegyű kód"), "042317");
    await user.type(screen.getByLabelText("Új jelszó"), "uj-eros-jelszo-1");
    await user.type(screen.getByLabelText("Új jelszó még egyszer"), "uj-eros-jelszo-1");
    await user.click(screen.getByRole("button", { name: "Jelszó módosítása" }));

    expect(authApi.resetPassword).toHaveBeenCalledWith({
      email: "anna@ceg.hu", code: "042317", password: "uj-eros-jelszo-1", password_confirmation: "uj-eros-jelszo-1",
    });
    expect(await screen.findByRole("heading", { name: "Kész, megváltozott a jelszavad" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tovább a belépéshez" })).toHaveAttribute("href", "/login");
  });

  it("asks for the email in the language the page is in", async () => {
    useUiStore.getState().setLang("en");
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText("Email"), "anna@ceg.hu");
    await user.click(screen.getByRole("button", { name: "Send code" }));
    expect(authApi.forgotPassword).toHaveBeenCalledWith("anna@ceg.hu", "en");
  });

  it("checks the code and the passwords before asking the server", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText("E-mail"), "anna@ceg.hu");
    await user.click(screen.getByRole("button", { name: "Kód küldése" }));
    await screen.findByRole("status");

    await user.type(screen.getByLabelText("6 jegyű kód"), "12ab");
    await user.type(screen.getByLabelText("Új jelszó"), "rovid");
    await user.type(screen.getByLabelText("Új jelszó még egyszer"), "masik");
    await user.click(screen.getByRole("button", { name: "Jelszó módosítása" }));

    expect(await screen.findByText("A kód 6 számjegyből áll.")).toBeInTheDocument();
    expect(screen.getByText("A jelszó legalább 12 karakter legyen.")).toBeInTheDocument();
    expect(screen.getByText("A két jelszó nem egyezik.")).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });
});
