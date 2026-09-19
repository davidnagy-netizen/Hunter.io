import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "../api/auth.api";
import { RegisterForm } from "./RegisterForm";
import type { AuthUser } from "../types/auth.types";

vi.mock("../api/auth.api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.mocked(authApi.register).mockReset();
  });

  it("rejects a too-short username and a too-short password client-side", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/felhasználónév|username/i), "ab");
    await user.type(screen.getByLabelText(/jelszó|password/i), "abc");
    await user.click(screen.getByRole("button", { name: /fiók létrehozása|create account/i }));

    expect(
      await screen.findByText(/3–32 karakter|3–32 characters/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/legalább 4 karakter|at least 4 characters/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("submits with only the required fields — company and email are optional", async () => {
    vi.mocked(authApi.register).mockResolvedValue({ success: true, user: {} as AuthUser });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/felhasználónév|username/i), "alfa-gyarto");
    await user.type(screen.getByLabelText(/jelszó|password/i), "s3cret1");
    await user.click(screen.getByRole("button", { name: /fiók létrehozása|create account/i }));

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        username: "alfa-gyarto",
        password: "s3cret1",
        company: "",
        email: "",
      }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("rejects a malformed email without calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/felhasználónév|username/i), "alfa-gyarto");
    await user.type(screen.getByLabelText(/jelszó|password/i), "s3cret1");
    await user.type(screen.getByLabelText(/e-mail|email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /fiók létrehozása|create account/i }));

    expect(
      await screen.findByText(/nem érvényes|not valid/i),
    ).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("shows the server's translated error when the username is already taken", async () => {
    vi.mocked(authApi.register).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { error: "Ez a felhasználónév már foglalt.", code: "USERNAME_TAKEN" } },
    });
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/felhasználónév|username/i), "alfa-gyarto");
    await user.type(screen.getByLabelText(/jelszó|password/i), "s3cret1");
    await user.click(screen.getByRole("button", { name: /fiók létrehozása|create account/i }));

    expect(
      await screen.findByText(/már foglalt|already taken/i),
    ).toBeInTheDocument();
  });
});
