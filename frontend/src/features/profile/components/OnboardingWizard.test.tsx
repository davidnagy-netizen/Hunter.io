import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import type { MeResponse } from "@/features/authentication/types/auth.types";
import { httpClient } from "@/shared/api/httpClient";
import { useCompanyProfile } from "../hooks/useCompanyProfile";
import { DEMO_PROFILE } from "../data/demoProfile";
import { OnboardingWizard } from "./OnboardingWizard";

vi.mock("@/features/authentication/api/auth.api", () => ({ authApi: { me: vi.fn() } }));
vi.mock("../hooks/useCompanyProfile", () => ({ useCompanyProfile: vi.fn() }));
vi.mock("@/shared/api/httpClient", () => ({ httpClient: { get: vi.fn() } }));
vi.mock("@/shared/api/meta.queries", () => ({ useMetaQuery: () => ({ data: { reference: { goals: [] } } }) }));
const saveProfile = vi.fn();
const profile = { ...DEMO_PROFILE, legal_form: "kft" as const, headcount: 0, revenue_band: 2, exact_revenue: null, county_code: "13", teaor_code: "6210", metrics_complete: true };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authApi.me).mockResolvedValue({ user: { id: "1", emailVerified: true }, plans: [], entitlements: {} } as unknown as MeResponse);
  vi.mocked(useCompanyProfile).mockReturnValue({ profile, saveProfile, isLoading: false, isSaving: false, saveError: null, loadDemo: vi.fn() });
  vi.mocked(httpClient.get).mockImplementation((url: string) => {
    if (url.includes("sectors")) return Promise.resolve({ data: { data: [{ code: "6210", label: "Szoftverkiadás" }] } });
    return Promise.resolve({ data: { counties: { "13": "Pest" } } });
  });
  saveProfile.mockResolvedValue(profile);
});
describe("company profile completion", () => {
  it("shows existing identity without an editable company-name input", async () => {
    renderWithProviders(<OnboardingWizard />);
    expect(await screen.findByText(profile.company)).toBeInTheDocument();
    expect(screen.queryByLabelText(/cégnév|company name/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/létszám|headcount/i)).toHaveValue(0);
  });
  it("blocks invalid metrics without saving", async () => {
    const user = userEvent.setup(); renderWithProviders(<OnboardingWizard />);
    const input = await screen.findByLabelText(/létszám|headcount/i);
    fireEvent.change(input, { target: { value: "-1" } });
    await user.click(screen.getByRole("button", { name: /^tovább$|continue/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("saves canonical metrics while preserving project context", async () => {
    const user = userEvent.setup(); renderWithProviders(<OnboardingWizard />);
    fireEvent.change(await screen.findByLabelText(/létszám|headcount/i), { target: { value: "12" } });
    await user.click(screen.getByRole("button", { name: /^tovább$|continue/i }));
    await user.click(screen.getByRole("button", { name: /profil mentése|save profile/i }));
    await waitFor(() => expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ headcount: 12, employees: 12, teaor_code: "6210", exact_revenue: null, goals: profile.goals })));
  });
});