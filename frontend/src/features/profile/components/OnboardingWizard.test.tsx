import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { metaApi } from "@/shared/api/meta.api";
import type { MetaResponse } from "@/shared/types/reference.types";
import { useLocalProfileStore } from "../store/localProfileStore";
import { useOnboardingDraftStore } from "../store/onboardingDraftStore";
import { DEMO_PROFILE } from "../data/demoProfile";
import { OnboardingWizard } from "./OnboardingWizard";

vi.mock("@/features/authentication/hooks/useAuth", () => ({
  useIsAuthenticated: vi.fn(),
}));

vi.mock("@/shared/api/meta.api", () => ({
  metaApi: { get: vi.fn() },
}));

const META: MetaResponse = {
  catalog: {},
  reference: {
    regions: [{ code: "HU12", name: "Pest megye", counties: ["Pest"] }],
    industries: [{ id: "manuf", label: "Gyártás / feldolgozóipar", teaor: "28" }],
    goals: [{ id: "digitalization", label: "Digitalizáció", label_en: "Digitalisation" }],
    revBands: ["500 M–1 Mrd Ft"],
    orgTypes: [{ id: "sme", label_hu: "KKV (max. 249 fő)", label_en: "SME (max 249 employees)" }],
  },
  labels: { programmes: {}, actions: {} },
  optionalProfileFields: [],
  today: "2026-09-19",
};

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    vi.mocked(metaApi.get).mockResolvedValue(META);
    useLocalProfileStore.getState().clear();
    useOnboardingDraftStore.getState().clear();
  });

  it("loading the demo company jumps to the company step with fields pre-filled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    await user.click(await screen.findByRole("button", { name: /mintacég betöltése|load example company/i }));

    expect(await screen.findByDisplayValue(DEMO_PROFILE.company)).toBeInTheDocument();
  });

  it("blocks 'Next' on the company step until the required fields are valid", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    await user.click(screen.getByRole("button", { name: /inkább kitöltöm magam|fill it in myself/i }));
    await user.click(screen.getByRole("button", { name: /^következő$|^next$/i }));

    // Still on the company step: its heading is still on screen, and at
    // least one required-field error appeared.
    expect(await screen.findByText(/adj meg egy cégnevet|enter a company name/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /a céged alapadatai|company's core data/i })).toBeInTheDocument();
  });

  it("walks the full wizard as an anonymous visitor and saves only to the local store", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    // intro -> company
    await user.click(screen.getByRole("button", { name: /inkább kitöltöm magam|fill it in myself/i }));

    // company step
    await user.type(screen.getByLabelText(/cégnév|company name/i), "Teszt Kft.");
    await user.type(screen.getByLabelText(/alkalmazottak száma|number of employees/i), "12");
    await user.selectOptions(screen.getByLabelText(/megye|county/i), "Pest");
    await user.click(screen.getByRole("button", { name: /1 év|1 year/i }));
    await user.click(screen.getByRole("button", { name: /^következő$|^next$/i }));

    // activity step
    await user.click(await screen.findByRole("button", { name: /gyártás|manufacturing/i }));
    await user.click(screen.getByRole("button", { name: /^következő$|^next$/i }));

    // goals step
    await user.click(await screen.findByRole("button", { name: /digitaliz/i }));
    await user.click(screen.getByRole("button", { name: /^következő$|^next$/i }));

    // investment step
    await user.type(screen.getByLabelText(/tervezett projektérték|planned project value/i), "30000000");
    await user.click(screen.getByRole("button", { name: /^következő$|^next$/i }));

    // setup step
    await user.click(await screen.findByRole("button", { name: /kkv|sme/i }));
    await user.click(screen.getByRole("button", { name: /csak önállóan|only on my own/i }));
    await user.click(screen.getByRole("button", { name: /találataim megnézése|see my matches/i }));

    await waitFor(() => expect(useLocalProfileStore.getState().profile?.company).toBe("Teszt Kft."));
    const saved = useLocalProfileStore.getState().profile!;
    expect(saved.employees).toBe(12);
    expect(saved.county).toBe("Pest");
    expect(saved.region).toBe("HU12");
    expect(saved.industryId).toBe("manuf");
    expect(saved.teaor).toBe("28");
    expect(saved.goals).toEqual(["digitalization"]);
    expect(saved.investment_value).toBe(30_000_000);
    expect(saved.orgType).toBe("sme");
    expect(saved.consortium_ready).toBe(false);
    expect(saved.initials).toBe("TK");
    expect(saved.country).toBe("HU");
    expect(useOnboardingDraftStore.getState().draft).toBeNull();
  });

  it("starts from a draft (e.g. the free assessment's answers) without needing a saved profile", async () => {
    useOnboardingDraftStore.getState().setDraft({ employees: 30, county: "Pest", region: "HU12", closed_business_years: 4 });
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    await user.click(screen.getByRole("button", { name: /inkább kitöltöm magam|fill it in myself/i }));
    expect(await screen.findByDisplayValue("30")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /megye|county/i })).toHaveValue("Pest");
    expect(screen.getByRole("button", { name: /2 vagy több|2 or more/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByDisplayValue("Assessment")).not.toBeInTheDocument();
  });

  it("a saved profile wins over a draft", async () => {
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    useOnboardingDraftStore.getState().setDraft({ employees: 999 });
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    await user.click(screen.getByRole("button", { name: /inkább kitöltöm magam|fill it in myself/i }));
    expect(await screen.findByDisplayValue(String(DEMO_PROFILE.employees))).toBeInTheDocument();
  });
});
