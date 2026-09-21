import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPPS } from "@engine-src/data/mockGrants.js";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated, useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import { metaApi } from "@/shared/api/meta.api";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { useLocalProfileStore } from "@/features/profile/store/localProfileStore";
import { useLocalAnswersStore } from "@/features/scoring/store/localAnswersStore";
import { useLocalSavedStore } from "../store/localSavedStore";
import { useCatalog, useSearchQuery } from "../api/opportunities.queries";
import type { SearchResponse, SearchRow, Teaser } from "../types/opportunities.types";
import { CalendarPage } from "./CalendarPage";
import { DashboardPage } from "./DashboardPage";
import { SavedPage } from "./SavedPage";
import { SearchPage } from "./SearchPage";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn(), useIsSubscriber: vi.fn() }));
vi.mock("@/shared/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));
vi.mock("../api/opportunities.queries", () => ({
  useCatalog: vi.fn(),
  useSearchQuery: vi.fn(),
  useOpportunityDetailQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
  opportunitiesKeys: { all: ["opportunities"] },
}));

const META = {
  today: "2026-09-07",
  catalog: { counts: { total: 621 }, eurHuf: 364.45 },
  labels: { programmes: { HORIZON: "Horizon Europe" }, actions: { "HORIZON-IA": "Innovation Action" } },
  reference: {
    regions: [{ code: "HU12", name: "Pest megye", counties: ["Pest"] }],
    goals: [{ id: "energy", label: "Energetika", label_en: "Energy" }],
    industries: [],
    revBands: [],
    orgTypes: [],
  },
} as never;

const TEASER: Teaser = { ref: "t0", locked: true, score: 88, band: null, estimated: false, grantHuf: 12_000_000, fundingMax: null, intensity: 0.5, closingSoon: true };
const row = (id: string, over: Partial<SearchRow> = {}): SearchRow => ({
  id, title: `Call ${id}`, program: "EU – Horizon Europe", deadline: "2026-11-05", daysLeft: 60, goals: [], intensity: 0.7,
  fundingMin: 1e6, fundingMax: 2e6, score: 77, blocked: false, estimated: false, verdict: "CONDITIONAL", band: null, blockedReasons: [], ...over,
});
const searchResult = (over: Partial<SearchResponse> = {}): SearchResponse => ({
  query: "", total: 2, page: 1, pageSize: 20, sort: "-score", lockedCount: 0,
  facets: { program: [{ value: "HORIZON", count: 2 }], goals: [{ value: "energy", count: 2 }], consortium: [{ value: "solo", count: 1 }, { value: "required", count: 1 }] },
  results: [row("a"), row("b", { blocked: true, score: null, verdict: "NOT_ELIGIBLE", blockedReasons: ["Eligible applicant types: ngo"] })],
  ...over,
});
const mockSearch = (data: SearchResponse | undefined, extra: object = {}) =>
  vi.mocked(useSearchQuery).mockReturnValue({ data, isLoading: false, error: null, ...extra } as never);
const fullCatalog = () =>
  vi.mocked(useCatalog).mockReturnValue({ catalog: { gated: false, total: OPPS.length, opportunities: OPPS }, isLoading: false, error: null } as never);

beforeEach(() => {
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  vi.mocked(useIsSubscriber).mockReturnValue(true);
  vi.mocked(metaApi.get).mockResolvedValue(META);
  vi.mocked(useSearchQuery).mockReset();
  useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
  useLocalAnswersStore.getState().clear();
  useLocalSavedStore.getState().clear();
});

describe("SearchPage", () => {
  it("shows the result count, scored rows and an excluded row with its reason", async () => {
    mockSearch(searchResult());
    renderWithProviders(<SearchPage />, { route: "/app/search?q=hydrogen" });

    expect(await screen.findByText(/2 találat|2 results/i)).toBeInTheDocument();
    expect(screen.getByText(/hydrogen/)).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText(/eligible applicant types: ngo/i)).toBeInTheDocument();
  });

  it("reads its state from the URL and asks for exactly that", () => {
    mockSearch(searchResult());
    renderWithProviders(<SearchPage />, { route: "/app/search?q=ai&sort=-score&goals=energy&page=2&consortium=solo" });

    const [state] = vi.mocked(useSearchQuery).mock.calls[0];
    expect(state).toEqual({
      q: "ai", sort: "-score", page: 2,
      filters: { program: [], goals: ["energy"], actionCode: [], consortium: "solo", eligibleOnly: false },
    });
  });

  it("clicking a facet value narrows the search and returns to page 1", async () => {
    mockSearch(searchResult());
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />, { route: "/app/search?page=3" });

    await user.click(await screen.findByRole("button", { name: /horizon europe/i }));

    const latest = vi.mocked(useSearchQuery).mock.calls.at(-1)![0];
    expect(latest.filters.program).toEqual(["HORIZON"]);
    expect(latest.page).toBe(1);
    // ...and it shows as a removable chip.
    expect(screen.getByRole("button", { name: /remove.*horizon europe|eltávolítás.*horizon europe/i })).toBeInTheDocument();
  });

  it("submitting the box searches for what was typed", async () => {
    mockSearch(searchResult());
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />, { route: "/app/search" });

    await user.type(screen.getByRole("searchbox"), "  hydrogen  {enter}");
    expect(vi.mocked(useSearchQuery).mock.calls.at(-1)![0].q).toBe("hydrogen");
  });

  it("shows locked rows, never real cards, for a gated account", async () => {
    mockSearch(searchResult({ results: [TEASER], total: 1, lockedCount: 1 }));
    renderWithProviders(<SearchPage />, { route: "/app/search" });

    expect(await screen.findByText(/feloldás|unlock/i)).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(within(screen.getByRole("article")).queryByRole("link")).not.toBeInTheDocument();
  });

  it("pages forward and back", async () => {
    mockSearch(searchResult({ total: 45, page: 2 }));
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />, { route: "/app/search?page=2" });

    expect(await screen.findByText("2 / 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /következő|next/i }));
    expect(vi.mocked(useSearchQuery).mock.calls.at(-1)![0].page).toBe(3);
  });

  it("shows an empty state and an error state", () => {
    mockSearch(searchResult({ results: [], total: 0 }));
    const { unmount } = renderWithProviders(<SearchPage />, { route: "/app/search?q=zzz" });
    expect(screen.getByText(/nincs találat|no results/i)).toBeInTheDocument();
    unmount();

    mockSearch(undefined, { error: new Error("index offline") });
    renderWithProviders(<SearchPage />, { route: "/app/search" });
    expect(screen.getByRole("alert")).toHaveTextContent(/index offline/);
  });
});

describe("CalendarPage", () => {
  it("groups the relevant matches by deadline month, each row linking to its call", async () => {
    fullCatalog();
    renderWithProviders(<CalendarPage />);

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0].textContent).toMatch(/\d{4}/);
    const firstLink = screen.getAllByRole("link")[0];
    expect(firstLink.getAttribute("href")).toMatch(/^\/app\/opportunities\//);
    expect(screen.getByText(/nem elérhető|not available yet/i)).toBeInTheDocument(); // honest: no reminders/.ics yet
  });

  it("for a gated account shows only the urgent teasers, with no dates", async () => {
    vi.mocked(useIsSubscriber).mockReturnValue(false);
    vi.mocked(useCatalog).mockReturnValue({
      catalog: { gated: true, total: 0, lockedTotal: 9, opportunities: [], teasers: [TEASER, { ...TEASER, ref: "t1", closingSoon: false }], stats: {} },
      isLoading: false, error: null,
    } as never);
    renderWithProviders(<CalendarPage />);
    expect(await screen.findAllByRole("article")).toHaveLength(1);
  });
});

describe("SavedPage", () => {
  it("shows an empty state until something is saved", async () => {
    fullCatalog();
    renderWithProviders(<SavedPage />);
    expect(await screen.findByText(/még nincs mentett|no saved grants/i)).toBeInTheDocument();
  });

  it("lists saved calls — including one the engine has ruled out, rather than hiding it", async () => {
    fullCatalog();
    useLocalSavedStore.getState().toggle("szechenyi-tech");
    useLocalSavedStore.getState().toggle("top-site");
    renderWithProviders(<SavedPage />);
    expect(await screen.findAllByRole("article")).toHaveLength(2);
  });

  it("tells a gated account that saved calls need a subscription", async () => {
    vi.mocked(useIsSubscriber).mockReturnValue(false);
    vi.mocked(useCatalog).mockReturnValue({
      catalog: { gated: true, total: 0, lockedTotal: 1, opportunities: [], teasers: [], stats: {} },
      isLoading: false, error: null,
    } as never);
    renderWithProviders(<SavedPage />);
    expect(await screen.findByText(/előfizetéssel nyílnak meg|unlock with a subscription/i)).toBeInTheDocument();
  });
});

describe("Dashboard upcoming deadlines", () => {
  it("lists the next few deadlines with a link to the full calendar", async () => {
    fullCatalog();
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByRole("heading", { name: /következő határidők|upcoming deadlines/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /teljes naptár|full calendar/i })).toHaveAttribute("href", "/app/calendar");
  });
});
