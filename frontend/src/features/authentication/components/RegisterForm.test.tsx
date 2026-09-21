import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "../api/auth.api";
import { taxpayerApi } from "../api/taxpayer.api";
import { RegisterForm } from "./RegisterForm";
import type { AuthUser, Taxpayer } from "../types/auth.types";

vi.mock("../api/auth.api", () => ({ authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() } }));
vi.mock("../api/taxpayer.api", () => ({ taxpayerApi: { lookup: vi.fn() } }));

const TAXPAYER: Taxpayer = {
  taxNumber: "12345674-2-42",
  companyName: "Alfa Gyártó és Kereskedelmi Kft.",
  shortName: "Alfa Gyártó Kft.",
  postalCode: "2100",
  city: "Gödöllő",
  streetAddress: "Páter Károly u. 1.",
  fullAddress: "2100 Gödöllő Páter Károly u. 1.",
  status: "VALID",
  incorporationDate: "2018-04-15",
};

const find = () => screen.getByRole("button", { name: /cég keresése|find my company/i });
const email = () => screen.getByLabelText(/e-mail|email/i);
const password = () => screen.getByLabelText(/jelszó|password/i);
const taxNumber = () => screen.getByLabelText(/adószám|tax number/i);
const terms = () => screen.getByRole("checkbox", { name: /általános szerződési|terms of service/i });
const marketing = () => screen.getByRole("checkbox", { name: /hírlevelet|newsletters/i });

async function fillStep1(user: ReturnType<typeof userEvent.setup>, over: { tax?: string; consent?: boolean } = {}) {
  await user.type(email(), "info@alfa.hu");
  await user.type(password(), "s3cret1");
  await user.type(taxNumber(), over.tax ?? "12345674-2-42");
  if (over.consent !== false) await user.click(terms());
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.mocked(authApi.register).mockReset();
    vi.mocked(taxpayerApi.lookup).mockReset();
  });

  it("asks for three things — email, password, tax number — and starts with both consents unticked", () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.queryByLabelText(/cégnév|company name/i)).not.toBeInTheDocument();
    expect(terms()).not.toBeChecked();
    expect(marketing()).not.toBeChecked();
  });

  it("keeps the two consents separate", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.click(marketing());
    expect(marketing()).toBeChecked();
    expect(terms()).not.toBeChecked();
  });

  it("refuses to look anything up without the terms consent, a valid email, password and tax number", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.type(email(), "nope");
    await user.type(password(), "abc");
    await user.type(taxNumber(), "12345675");
    await user.click(find());

    expect(await screen.findByText(/az e-mail cím nem érvényes|email address isn't valid/i)).toBeInTheDocument();
    expect(screen.getByText(/legalább 4 karakter|at least 4 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/érvényes magyar adószámot|valid hungarian tax number/i)).toBeInTheDocument();
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(4); // …and the missing consent
    expect(taxpayerApi.lookup).not.toHaveBeenCalled();
  });

  it("does not look the company up when only the consent is missing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await fillStep1(user, { consent: false });
    await user.click(find());
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(taxpayerApi.lookup).not.toHaveBeenCalled();
  });

  it("shows what NAV returned read-only, and creates the account with that company name", async () => {
    vi.mocked(taxpayerApi.lookup).mockResolvedValue(TAXPAYER);
    vi.mocked(authApi.register).mockResolvedValue({ success: true, user: {} as AuthUser });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm onSuccess={onSuccess} />);

    await fillStep1(user);
    await user.click(find());

    expect(await screen.findByText(TAXPAYER.companyName)).toBeInTheDocument();
    expect(screen.getByText(TAXPAYER.fullAddress)).toBeInTheDocument();
    expect(taxpayerApi.lookup).toHaveBeenCalledWith("12345674-2-42");
    // The company is confirmed, not typed: there is no field to edit its name.
    expect(screen.queryByRole("textbox", { name: /cégnév|company name/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ez az én cégem|this is my company/i }));
    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        username: "info",
        password: "s3cret1",
        company: TAXPAYER.companyName,
        email: "info@alfa.hu",
      }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(TAXPAYER));
  });

  it("prefills the username from the email and lets the visitor change it", async () => {
    vi.mocked(taxpayerApi.lookup).mockResolvedValue(TAXPAYER);
    vi.mocked(authApi.register).mockResolvedValue({ success: true, user: {} as AuthUser });
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await fillStep1(user);
    await user.click(find());

    const username = await screen.findByLabelText(/felhasználónév|username/i);
    expect(username).toHaveValue("info");
    await user.clear(username);
    await user.type(username, "alfa-gyarto");
    await user.click(screen.getByRole("button", { name: /ez az én cégem|this is my company/i }));
    await waitFor(() => expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({ username: "alfa-gyarto" })));
  });

  it("says why when NAV does not know the number, and stays on step 1 with what was typed", async () => {
    vi.mocked(taxpayerApi.lookup).mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { error: "Nem található.", code: "TAXPAYER_LOOKUP_FAILED" } },
    });
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await fillStep1(user);
    await user.click(find());

    expect(await screen.findByText(/nem sikerült ellenőrizni|couldn't verify/i)).toBeInTheDocument();
    expect(taxNumber()).toHaveValue("12345674-2-42");
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("does not let a company NAV lists as inactive register", async () => {
    vi.mocked(taxpayerApi.lookup).mockResolvedValue({ ...TAXPAYER, status: "DELETED" });
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await fillStep1(user);
    await user.click(find());

    expect(await screen.findByText(/„DELETED”|"DELETED"/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ez az én cégem|this is my company/i })).toBeDisabled();
  });

  it("goes back to step 1 to change the tax number, keeping the rest", async () => {
    vi.mocked(taxpayerApi.lookup).mockResolvedValue(TAXPAYER);
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await fillStep1(user);
    await user.click(find());
    await user.click(await screen.findByRole("button", { name: /másik adószámot|different tax number/i }));

    expect(taxNumber()).toHaveValue("12345674-2-42");
    expect(email()).toHaveValue("info@alfa.hu");
  });

  it("shows the server's translated error when the username is already taken", async () => {
    vi.mocked(taxpayerApi.lookup).mockResolvedValue(TAXPAYER);
    vi.mocked(authApi.register).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { error: "Ez a felhasználónév már foglalt.", code: "USERNAME_TAKEN" } },
    });
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await fillStep1(user);
    await user.click(find());
    await user.click(await screen.findByRole("button", { name: /ez az én cégem|this is my company/i }));

    expect(await screen.findByText(/már foglalt|already taken/i)).toBeInTheDocument();
  });
});
