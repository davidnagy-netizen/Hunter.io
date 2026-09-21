import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPPS } from "@server-src/data/mockGrants.js";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated, useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import { metaApi } from "@/shared/api/meta.api";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { useLocalProfileStore } from "@/features/profile/store/localProfileStore";
import { useLocalAnswersStore } from "@/features/scoring/store/localAnswersStore";
import { useLocalSavedStore } from "../store/localSavedStore";
import { useCatalog, useOpportunityDetailQuery } from "../api/opportunities.queries";
import type { Teaser } from "../types/opportunities.types";
import { DashboardPage } from "./DashboardPage";
import { OpportunitiesPage } from "./OpportunitiesPage";
import { OpportunityDetailPage } from "./OpportunityDetailPage";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn(), useIsSubscriber: vi.fn() }));
vi.mock("@/shared/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));
vi.mock("../api/opportunities.queries", () => ({
  useCatalog: vi.fn(),
  useSearchQuery: vi.fn(),
  useOpportunityDetailQuery: vi.fn(),
  opportunitiesKeys: { all: ["opportunities"] },
}));

const META = {
  today: "2026-09-07",
  reference: {
    regions: [{ code: "HU12", name: "Pest megye", counties: ["Pest"] }],
    goals: [{ id: "digitalization", label: "Digitalizáció", label_en: "Digitalisation" }],
    industries: [],
    revBands: [],
    orgTypes: [],
  },
} as never;

function fullCatalog() {
  vi.mocked(useCatalog).mockReturnValue({
    catalog: { gated: false, total: OPPS.length, opportunities: OPPS },
    isLoading: false,
    error: null,
  } as never);
}

const TEASERS: Teaser[] = [
  { ref: "t0", locked: true, score: 91, band: { key: "strong", label: "x" }, estimated: false, grantHuf: 24_000_000, fundingMax: null, intensity: 0.8, closingSoon: true },
  { ref: "t1", locked: true, score: 64, band: { key: "conditional", label: "x" }, estimated: true, grantHuf: null, fundingMax: 90_000_000, intensity: 0.5, closingSoon: false },
];

function gatedCatalog() {
  vi.mocked(useCatalog).mockReturnValue({
    catalog: {
      gated: true,
      total: 0,
      lockedTotal: 175,
      opportunities: [],
      teasers: TEASERS,
      stats: { catalogTotal: 621, openTotal: 241, eligible: 187, blocked: 54, strong: 9, closingSoon: 101, needsAnswer: 4 },
    },
    isLoading: false,
    error: null,
  } as never);
}

beforeEach(() => {
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  vi.mocked(useIsSubscriber).mockReturnValue(true);
  vi.mocked(metaApi.get).mockResolvedValue(META);
  vi.mocked(useOpportunityDetailQuery).mockReturnValue({ data: undefined, isLoading: false } as never);
  useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
  useLocalAnswersStore.getState().clear();
  useLocalSavedStore.getState().clear();
});

describe("DashboardPage", () => {
  it("shows the four stat tiles and only the 70+ matches by default, with a toggle for the rest", async () => {
    fullCatalog();
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText(/alfa gyártó kft/i)).toBeInTheDocument();
    const before = (await screen.findAllByRole("article")).length;
    expect(before).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /alacsonyabb relevancia|include lower relevance/i }));
    expect(screen.getAllByRole("article").length).toBeGreaterThanOrEqual(before);
    expect(screen.getByRole("button", { name: /csak a 70\+|only 70\+/i })).toBeInTheDocument();
  });

  it("for a gated account shows the server's totals and locked teasers, never real cards", async () => {
    vi.mocked(useIsSubscriber).mockReturnValue(false);
    gatedCatalog();
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText("187")).toBeInTheDocument(); // the server's eligible total, not a local count
    expect(screen.getAllByText(/feloldás|unlock/i)).toHaveLength(2);
    expect(screen.getByText("91")).toBeInTheDocument();
    expect(screen.getByText(/175/)).toBeInTheDocument(); // "175 more matches are waiting"
    expect(screen.queryByRole("link")).not.toBeNull(); // the sign-up CTA only
    expect(screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent)).not.toContain(OPPS[0].title);
  });
});

describe("OpportunitiesPage", () => {
  it("lists what qualifies and, separately, what the engine ruled out with the reason", async () => {
    fullCatalog();
    renderWithProviders(<OpportunitiesPage />);

    expect(await screen.findByRole("heading", { name: /releváns \(\d+\)|relevant \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /nem jogosult \(\d+\)|not eligible \(\d+\)/i })).toBeInTheDocument();
    // TOP Plusz is excluded for the demo company: Pest county isn't an eligible location.
    const blocked = screen.getByRole("link", { name: new RegExp(OPPS.find((o) => o.id === "top-site")!.title.slice(0, 12)) });
    expect(within(blocked.closest("article")!).getByText(/nálad|yours/i)).toBeInTheDocument();
  });

  it("shows only teasers for a gated account", async () => {
    vi.mocked(useIsSubscriber).mockReturnValue(false);
    gatedCatalog();
    renderWithProviders(<OpportunitiesPage />);
    expect(await screen.findAllByRole("article")).toHaveLength(2);
    expect(screen.queryByRole("heading", { name: /not eligible|nem jogosult/i, level: 2 })).not.toBeInTheDocument();
  });

  it("shows a loading state and an error state", () => {
    vi.mocked(useCatalog).mockReturnValue({ catalog: undefined, isLoading: true, error: null } as never);
    const { unmount } = renderWithProviders(<OpportunitiesPage />);
    expect(screen.getByText(/betöltés|loading/i)).toBeInTheDocument();
    unmount();

    vi.mocked(useCatalog).mockReturnValue({ catalog: undefined, isLoading: false, error: new Error("boom") } as never);
    renderWithProviders(<OpportunitiesPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(/boom/);
  });
});

function renderDetail(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/app/opportunities/:id" element={<OpportunityDetailPage />} />
    </Routes>,
    { route: `/app/opportunities/${id}` },
  );
}

describe("OpportunityDetailPage", () => {
  it("explains a qualifying call and resolves its open question inline, recalculating the score", async () => {
    fullCatalog();
    const user = userEvent.setup();
    renderDetail("ginop-dig");

    expect(await screen.findByText(/becsült|estimated/i)).toBeInTheDocument(); // 87, INSUFFICIENT_DATA
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getAllByText(/de minimis/i).length).toBeGreaterThanOrEqual(2); // the rule and its question

    await user.click(screen.getByRole("button", { name: /^igen$|^yes$/i }));

    await waitFor(() => expect(screen.getByText("89")).toBeInTheDocument());
    expect(screen.queryByText(/becsült|estimated/i)).not.toBeInTheDocument();
    expect(useLocalAnswersStore.getState().answers).toEqual({ de_minimis_ok: true });
  });

  it("shows the exclusion reasons, and no calculator or apply panel, for a ruled-out call", async () => {
    fullCatalog();
    renderDetail("top-site");

    expect(await screen.findByText(/nem releváns|not relevant/i)).toBeInTheDocument();
    expect(screen.getByText(/kizáró feltételek|exclusion criteria/i)).toBeInTheDocument();
    expect(screen.queryByText(/támogatáskalkulátor|grant calculator/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hogyan pályázz|how to apply/i)).not.toBeInTheDocument();
  });

  it("recalculates the grant live in the calculator", async () => {
    fullCatalog();
    const user = userEvent.setup();
    renderDetail("szechenyi-tech");

    const input = await screen.findByLabelText(/tervezett projektérték|planned project value/i);
    await user.clear(input);
    await user.type(input, "10000000");

    const intensity = OPPS.find((o) => o.id === "szechenyi-tech")!.intensity;
    const expectedMillions = String(Math.round(10 * intensity));
    const out = screen.getByText(/várható támogatás|expected funding/i).closest("div")!;
    expect(out.textContent).toContain(expectedMillions);
    expect(out.textContent).toMatch(/M Ft|M HUF/);
  });

  it("saves and unsaves a call (browser-only when anonymous)", async () => {
    fullCatalog();
    const user = userEvent.setup();
    renderDetail("szechenyi-tech");

    await user.click(await screen.findByRole("button", { name: /^elmentem$|^save$/i }));
    expect(useLocalSavedStore.getState().ids).toEqual(["szechenyi-tech"]);
    expect(screen.getByRole("button", { name: /elmentve|saved/i })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /elmentve|saved/i }));
    expect(useLocalSavedStore.getState().ids).toEqual([]);
  });

  it("opens a call the open-calls catalog doesn't hold by fetching it from the server", async () => {
    fullCatalog();
    const forthcoming = { ...OPPS.find((o) => o.id === "szechenyi-tech")!, id: "forthcoming-1", title: "A forthcoming call" };
    vi.mocked(useOpportunityDetailQuery).mockReturnValue({ data: forthcoming, isLoading: false } as never);
    renderDetail("forthcoming-1");

    expect(await screen.findByRole("heading", { level: 1, name: "A forthcoming call" })).toBeInTheDocument();
    expect(vi.mocked(useOpportunityDetailQuery)).toHaveBeenCalledWith("forthcoming-1", true);
  });

  it("does not ask the server for a call that IS in the catalog", async () => {
    fullCatalog();
    renderDetail("szechenyi-tech");
    await screen.findByRole("heading", { level: 1 });
    expect(vi.mocked(useOpportunityDetailQuery)).toHaveBeenCalledWith("szechenyi-tech", false);
  });

  it("says a call is unavailable when it isn't in the catalog", async () => {
    fullCatalog();
    renderDetail("no-such-call");
    expect(await screen.findByText(/már nem elérhető|no longer available/i)).toBeInTheDocument();
  });

  it("withholds the details from a gated account", async () => {
    vi.mocked(useIsSubscriber).mockReturnValue(false);
    gatedCatalog();
    renderDetail("anything");
    expect(await screen.findByText(/előfizetéssel nyílnak meg|unlock with a subscription/i)).toBeInTheDocument();
  });
});
