import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { httpClient } from "@/api/httpClient";
import { authApi } from "../api/auth.api";
import { taxpayerApi } from "../api/taxpayer.api";
import type { AuthUser, Taxpayer } from "../types/auth.types";
import { RegisterForm } from "./RegisterForm";

vi.mock("../api/auth.api", () => ({ authApi: { register: vi.fn(), me: vi.fn() } }));
vi.mock("../api/taxpayer.api", () => ({ taxpayerApi: { lookup: vi.fn() } }));
vi.mock("@/api/httpClient", () => ({ httpClient: { get: vi.fn() } }));

const taxpayer: Taxpayer = { taxNumber: "12345676-2-42", companyName: "Verified Company", shortName: "Verified",
  postalCode: "1117", city: "Budapest", streetAddress: "Alíz utca 2.", fullAddress: "1117 Budapest Alíz utca 2.",
  status: "VALID", incorporationDate: null, verificationReceipt: "encrypted-receipt" };
const metrics = { legal_form: "kft", headcount: 0, revenue_band: 2, exact_revenue: null, county_code: "13", teaor_code: "6210", closed_business_years: 2 };

beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear();
  vi.mocked(taxpayerApi.lookup).mockResolvedValue(taxpayer);
  vi.mocked(authApi.register).mockResolvedValue({ success: true, user: {} as AuthUser });
  vi.mocked(httpClient.get).mockImplementation(async url => ({ data: url === "/v1/onboarding/options" ? { counties: { "01": "Budapest", "13": "Pest" } } : { data: [{ code: "6210", label: "Számítógépes programozás" }] } }));
});

async function lookupCompany(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/adószám|tax number/i), { target: { value: "12345676242" } });
  await user.click(screen.getByRole("button", { name: /cég keresése|find company/i }));
  await screen.findByText("Verified Company");
}
async function credentialsStep(user: ReturnType<typeof userEvent.setup>) {
  await lookupCompany(user);
  await user.click(screen.getByRole("button", { name: /megerősítés és tovább|confirm and continue/i }));
  await user.click(screen.getByRole("button", { name: /^tovább$|^continue$/i }));
}

describe("Rev-2 registration", () => {
  it("starts with tax identity only and blocks invalid checksums", () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/adószám|tax number/i), { target: { value: "12345674" } });
    expect(screen.getByRole("button", { name: /cég keresése|find company/i })).toBeDisabled();
    expect(taxpayerApi.lookup).not.toHaveBeenCalled();
  });
  it("formats digits and invalidates verified identity when the tax number changes", async () => {
    const user = userEvent.setup(); renderWithProviders(<RegisterForm />);
    await lookupCompany(user);
    expect(screen.getByLabelText(/adószám|tax number/i)).toHaveValue("12345676-2-42");
    fireEvent.change(screen.getByLabelText(/adószám|tax number/i), { target: { value: "10000001" } });
    expect(screen.queryByText("Verified Company")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /megerősítés és tovább|confirm and continue/i })).toBeDisabled();
  });
  it("ignores a stale response after the user changes the identifier", async () => {
    let resolve: (value: Taxpayer) => void = () => {};
    vi.mocked(taxpayerApi.lookup).mockImplementation(() => new Promise<Taxpayer>(done => { resolve = done; }));
    const user = userEvent.setup(); renderWithProviders(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adószám|tax number/i), { target: { value: "12345676" } });
    await user.click(screen.getByRole("button", { name: /cég keresése|find company/i }));
    fireEvent.change(screen.getByLabelText(/adószám|tax number/i), { target: { value: "10000001" } });
    await act(async () => resolve(taxpayer));
    expect(screen.queryByText("Verified Company")).not.toBeInTheDocument();
  });
  it("requires fresh lookup after reload and keeps all three consents unchecked", async () => {
    sessionStorage.setItem("fundor-registration-v2", JSON.stringify({ taxNumber: "12345676", metrics }));
    const user = userEvent.setup(); renderWithProviders(<RegisterForm />);
    expect(screen.getByRole("button", { name: /megerősítés és tovább|confirm and continue/i })).toBeDisabled();
    await credentialsStep(user);
    for (const checkbox of screen.getAllByRole("checkbox")) expect(checkbox).not.toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: /értesítéseket|updates/i }));
    expect(screen.getByRole("checkbox", { name: /általános|terms/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /adatkezelési|privacy/i })).not.toBeChecked();
  });
  it("submits metrics and the receipt without storing credentials or client company identity", async () => {
    sessionStorage.setItem("fundor-registration-v2", JSON.stringify({ metrics }));
    const onSuccess = vi.fn(); const user = userEvent.setup(); renderWithProviders(<RegisterForm onSuccess={onSuccess} />);
    await credentialsStep(user);
    fireEvent.change(screen.getByLabelText(/kapcsolattartó|contact name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/jelszó \(legalább|password \(at least/i), { target: { value: "correct-horse-battery" } });
    fireEvent.change(screen.getByLabelText(/jelszó megerősítése|confirm password/i), { target: { value: "correct-horse-battery" } });
    expect(sessionStorage.getItem("fundor-registration-v2")).not.toContain("correct-horse-battery");
    await user.click(screen.getByRole("checkbox", { name: /általános|terms/i }));
    await user.click(screen.getByRole("checkbox", { name: /adatkezelési|privacy/i }));
    await user.click(screen.getByRole("button", { name: /fiók létrehozása|create account/i }));
    await waitFor(() => expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({ verification_receipt: "encrypted-receipt", metrics, marketing_opt_in: false })));
    expect(vi.mocked(authApi.register).mock.calls[0]?.[0]).not.toHaveProperty("company");
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(taxpayer));
    expect(sessionStorage.getItem("fundor-registration-v2")).toBeNull();
  });
  it("preserves input and allows retry after NAV failure", async () => {
    vi.mocked(taxpayerApi.lookup).mockRejectedValueOnce(new Error("timeout"));
    const user = userEvent.setup(); renderWithProviders(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adószám|tax number/i), { target: { value: "12345676" } });
    await user.click(screen.getByRole("button", { name: /cég keresése|find company/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cég keresése|find company/i }));
    expect(await screen.findByText("Verified Company")).toBeInTheDocument();
  });
});