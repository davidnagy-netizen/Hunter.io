import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "../api/auth.api";
import { LoginForm } from "./LoginForm";
import type { AuthUser } from "../types/auth.types";

vi.mock("../api/auth.api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset();
  });

  it("shows a validation error for each empty field and never calls the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /belépés|sign in/i }));

    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("submits the entered credentials and calls onSuccess", async () => {
    const signedIn = { username: "demo", role: "user" } as AuthUser;
    vi.mocked(authApi.login).mockResolvedValue({ success: true, user: signedIn });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/felhasználónév|username/i), "demo");
    await user.type(screen.getByLabelText(/jelszó|password/i), "demo1234");
    await user.click(screen.getByRole("button", { name: /belépés|sign in/i }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({ username: "demo", password: "demo1234" }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(signedIn));
  });

  it("shows the server's translated error message on a rejected login", async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { error: "Hibás felhasználónév vagy jelszó.", code: "BAD_CREDENTIALS" } },
    });
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/felhasználónév|username/i), "demo");
    await user.type(screen.getByLabelText(/jelszó|password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /belépés|sign in/i }));

    expect(
      await screen.findByText(/hibás felhasználónév vagy jelszó|incorrect username or password/i),
    ).toBeInTheDocument();
  });
});
