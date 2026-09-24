import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { metaApi } from "@/shared/api/meta.api";
import type { MetaResponse } from "@/shared/types/reference.types";
import { adminApi } from "../api/admin.api";
import { makeUser } from "../testFixtures";
import { UserHistoryPage } from "./UserHistoryPage";

vi.mock("../api/admin.api", () => ({
  adminApi: { overview: vi.fn(), users: vi.fn(), history: vi.fn(), grant: vi.fn(), revoke: vi.fn(), patchUser: vi.fn(), refreshCatalog: vi.fn() },
}));
vi.mock("@/shared/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));

const META = {
  catalog: null,
  reference: { regions: [], industries: [], goals: [{ id: "digitalization", label: "Digitalizáció", label_en: "Digitalisation" }], revBands: [], orgTypes: [] },
  labels: { programmes: {}, actions: {} },
  optionalProfileFields: [],
  today: "2026-09-19",
} as MetaResponse;

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/users/:id" element={<UserHistoryPage />} />
      <Route path="/admin/users" element={<p>users list</p>} />
    </Routes>,
    { route: "/admin/users/u1" },
  );

beforeEach(() => {
  vi.mocked(metaApi.get).mockResolvedValue(META);
  vi.mocked(adminApi.history).mockResolvedValue({
    user: makeUser({ id: "u1", username: "kata" }),
    // Distinct from the version diff's own before/after values below (28→45, digitalization, 60M)
    // so assertions on either the summary or the diff can each find a unique match.
    current: {
      company: "Alfa Gyártó Kft.",
      employees: 12,
      county: "Pest",
      industryId: "manuf",
      closed_business_years: 4,
      goals: [],
      investment_value: 15_000_000,
      funding_pref: ["non_refundable"],
    },
    subscriptions: [
      { at: "2026-09-12T10:00:00.000Z", action: "granted", by: "admin", plan: "monthly", days: 30, note: "wire transfer" },
      { at: "2026-09-11T10:00:00.000Z", action: "revoked", by: "admin" },
    ],
    versions: [
      {
        version: 2,
        at: "2026-09-13T10:00:00.000Z",
        source: "profile",
        changed: [
          { field: "employees", from: 28, to: 45 },
          { field: "goals", from: [], to: ["digitalization"] },
          { field: "investment_value", from: 30_000_000, to: 60_000_000 },
          { field: "consortium_ready", from: false, to: true },
        ],
      },
      { version: 1, at: "2026-09-12T11:00:00.000Z", source: "profile", changed: [] },
    ],
    activity: [{ at: "2026-09-13T10:00:00.000Z", type: "profile.saved", title: undefined }, { at: "2026-09-13T09:00:00.000Z", type: "search", q: "hydrogen" }],
  });
});

describe("UserHistoryPage", () => {
  it("asks the server for the account in the URL", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "kata" });
    expect(adminApi.history).toHaveBeenCalledWith("u1");
  });

  it("shows the account's current profile, not just its version diffs", async () => {
    renderPage();
    expect(await screen.findByText("Alfa Gyártó Kft.")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/15 M Ft|15M HUF/)).toBeInTheDocument();
  });

  it("says there's no saved profile for an account that never onboarded", async () => {
    vi.mocked(adminApi.history).mockResolvedValue({ user: makeUser(), current: null, subscriptions: [], versions: [], activity: [] });
    renderPage();
    expect(await screen.findByText(/még nem mentett cégprofilt|hasn't saved a company profile/i)).toBeInTheDocument();
  });

  it("logs what was granted and revoked, with who and why", async () => {
    renderPage();
    expect(await screen.findByText(/megadva|granted/i, { selector: "b" })).toBeInTheDocument();
    expect(screen.getByText(/monthly.*30.*by: admin.*wire transfer|monthly.*30.*által: admin.*wire transfer/i)).toBeInTheDocument();
    expect(screen.getByText(/visszavonva|revoked/i, { selector: "b" })).toBeInTheDocument();
  });

  it("renders each profile change as a readable before → after", async () => {
    renderPage();
    expect(await screen.findByText(/^létszám$|^employees$/i)).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    // goals by name once the reference data has loaded, money formatted, flags as words
    expect(await screen.findByText(/digitalizáció|digitalisation/i)).toBeInTheDocument();
    expect(screen.getByText(/60 M Ft|60M HUF/)).toBeInTheDocument();
    expect(screen.getByText(/^igen$|^yes$/i)).toBeInTheDocument();
  });

  it("names activity events and shows what was searched for", async () => {
    renderPage();
    expect(await screen.findByText(/cégprofil mentve|company profile saved/i)).toBeInTheDocument();
    expect(screen.getByText(/hydrogen/)).toBeInTheDocument();
  });

  it("says so for an account with no history yet", async () => {
    vi.mocked(adminApi.history).mockResolvedValue({ user: makeUser(), current: null, subscriptions: [], versions: [], activity: [] });
    renderPage();
    expect(await screen.findByText(/még nem kapott hozzáférést|never had access/i)).toBeInTheDocument();
    expect(screen.getByText(/nincs mentett profil|no saved profile/i)).toBeInTheDocument();
    expect(screen.getByText(/nincs rögzített tevékenység|no activity recorded/i)).toBeInTheDocument();
  });

  it("shows the server's message for an account that doesn't exist", async () => {
    vi.mocked(adminApi.history).mockRejectedValue({ isAxiosError: true, message: "x", response: { status: 404, data: { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" } } });
    renderPage();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("links back to the user list", async () => {
    renderPage();
    expect(await screen.findByRole("link", { name: /vissza a felhasználókhoz|back to users/i })).toHaveAttribute("href", "/admin/users");
  });
});
