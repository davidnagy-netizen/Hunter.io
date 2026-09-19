import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { crmApi } from "../api/crm.api";
import { makeLead, makeLeadsResponse } from "../testFixtures";
import { LeadsPage } from "./LeadsPage";

vi.mock("../api/crm.api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/crm.api")>()),
  crmApi: { board: vi.fn(), contacts: vi.fn(), leads: vi.fn(), contact: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(crmApi.leads).mockReset();
});

describe("LeadsPage", () => {
  it("shows who to call, how to reach them, and what they submitted", async () => {
    vi.mocked(crmApi.leads).mockResolvedValue(
      makeLeadsResponse([makeLead({ phone: "+36 1 234", profile: { employees: 30, county: "Pest", investment_value: 60_000_000 } })]),
    );
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByText("Lead Bt.")).toBeInTheDocument();
    expect(screen.getByText(/Lili · lead@example\.com · \+36 1 234/)).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText(/30 fő · Pest · 60 M Ft|30 staff · Pest · 60M HUF/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /megnyitás|open/i })).toHaveAttribute("href", "/admin/crm/contact/l1");
  });

  it("marks a lead that has since become an account", async () => {
    vi.mocked(crmApi.leads).mockResolvedValue(makeLeadsResponse([makeLead({ convertedUserId: "u9" })]));
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByText(/fiókká vált|became an account/i)).toBeInTheDocument();
  });

  it("copes with a lead that arrived without a readiness score or a profile", async () => {
    vi.mocked(crmApi.leads).mockResolvedValue(makeLeadsResponse([makeLead({ readiness: null, profile: null, contactName: null })]));
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByText("Lead Bt.")).toBeInTheDocument();
    expect(screen.queryByText(/\/ 100/)).not.toBeInTheDocument();
  });

  it("explains where leads come from when there are none", async () => {
    vi.mocked(crmApi.leads).mockResolvedValue(makeLeadsResponse([]));
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByText(/még nem érkezett érdeklődő|no leads yet/i)).toBeInTheDocument();
    expect(screen.getByText(/ingyenes felmérés végén|free assessment offers/i)).toBeInTheDocument();
  });

  it("says why the list could not load", async () => {
    vi.mocked(crmApi.leads).mockRejectedValue(new Error("boom"));
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });
});
