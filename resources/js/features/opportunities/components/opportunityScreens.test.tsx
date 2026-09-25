import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALL, answeredConsortium, detailOf, subscriberCatalog } from "@/test/apiFixtures";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated, useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import { metaApi } from "@/api/meta.api";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { useLocalProfileStore } from "@/features/profile/store/localProfileStore";
import { useEligibilityAnswers } from "@/features/scoring/hooks/useEligibilityAnswers";
import { formatHuf } from "@/lib/format";
import { useLocalSavedStore } from "../store/localSavedStore";
import { useCatalog, useOpportunityDetailQuery } from "../api/opportunities.queries";
import type { Teaser } from "../types/opportunities.types";
import { DashboardPage } from "@/pages/opportunities/DashboardPage";
import { OpportunitiesPage } from "@/pages/opportunities/OpportunitiesPage";
import { OpportunityDetailPage } from "@/pages/opportunities/OpportunityDetailPage";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn(), useIsSubscriber: vi.fn() }));
vi.mock("@/features/scoring/hooks/useEligibilityAnswers", () => ({ useEligibilityAnswers: vi.fn() }));
vi.mock("@/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));
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

/** The subscriber catalog the real API returned; `tweak` adjusts it for one test. */
function fullCatalog(tweak?: (catalog: ReturnType<typeof subscriberCatalog>) => void) {
  const catalog = subscriberCatalog();
  tweak?.(catalog);
  vi.mocked(useCatalog).mockReturnValue({ catalog, isLoading: false, error: null } as never);
  return catalog;
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

const answerQuestion = vi.fn();

beforeEach(() => {
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  vi.mocked(useIsSubscriber).mockReturnValue(true);
  vi.mocked(metaApi.get).mockResolvedValue(META);
  vi.mocked(useOpportunityDetailQuery).mockReturnValue({ data: undefined, isLoading: false } as never);
  useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
  answerQuestion.mockReset();
  vi.mocked(useEligibilityAnswers).mockReturnValue({ answers: {}, answerQuestion, isSaving: false });
  useLocalSavedStore.getState().clear();
});

describe("DashboardPage", () => {
  it("shows the server's four totals and only the 70+ matches by default, with a toggle for the rest", async () => {
    const catalog = fullCatalog((c) => {
      c.opportunities[0].score = 91; // the fixture company's best real score is 69; lift one so the default view has a card
    });
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText(/alfa gyártó kft/i)).toBeInTheDocument();
    expect(screen.getByText(String(catalog.stats.eligible))).toBeInTheDocument(); // straight from `stats`, not counted here
    expect(await screen.findAllByRole("article")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /alacsonyabb relevancia|include lower relevance/i }));
    expect(screen.getAllByRole("article")).toHaveLength(catalog.stats.eligible);
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
    for (const row of subscriberCatalog().opportunities) expect(screen.queryByText(row.title)).not.toBeInTheDocument();
  });
});

describe("OpportunitiesPage", () => {
  it("lists what qualifies best-first and, separately, what was ruled out with the reason", async () => {
    const catalog = fullCatalog();
    renderWithProviders(<OpportunitiesPage />);

    expect(await screen.findByRole("heading", { name: new RegExp(`(releváns|relevant) \\(${catalog.stats.eligible}\\)`, "i") })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: new RegExp(`(nem jogosult|not eligible) \\(${catalog.stats.blocked}\\)`, "i") })).toBeInTheDocument();

    const scores = screen.getAllByRole("article").slice(0, catalog.stats.eligible).map((a) => Number(a.querySelector("span.font-display")?.textContent));
    expect(scores).toEqual([...scores].sort((x, y) => y - x));

    // The Daphne call is ruled out for an SME: the card says why, with the company's own value.
    const blocked = screen.getByRole("link", { name: /preventing gender-based violence/i });
    expect(within(blocked.closest("article")!).getByText(/pályázhat: ngo/i)).toBeInTheDocument();
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
  it("explains a qualifying call with the server's own words and asks its open question inline", async () => {
    const catalog = fullCatalog();
    const row = catalog.opportunities.find((o) => o.id === CALL.consortium)!;
    renderDetail(CALL.consortium);

    expect(await screen.findByRole("heading", { level: 1, name: row.title })).toBeInTheDocument();
    expect(screen.getByText(/becsült|estimated/i)).toBeInTheDocument(); // INSUFFICIENT_DATA
    expect(screen.getByText(String(row.score))).toBeInTheDocument();
    // What passed and what to watch are the server's sentences, verbatim.
    expect(screen.getByText(row.checks.find((c) => c.status === "pass")!.label)).toBeInTheDocument();
    expect(screen.getByText(row.conditions[0])).toBeInTheDocument();
    // The open question is the server's too.
    expect(screen.getByText(row.questions[0].q_hu)).toBeInTheDocument();
  });

  it("sends the answer to the server; it does not rescore anything itself", async () => {
    fullCatalog();
    const user = userEvent.setup();
    renderDetail(CALL.consortium);

    await user.click(await screen.findByRole("button", { name: /^igen, van partnerhálózatom$/i }));
    expect(answerQuestion).toHaveBeenCalledWith(CALL.consortium, "consortium_ready", true);
  });

  it("shows the re-scored call once the server has answered: a firm score, no estimate, no question", async () => {
    const answered = answeredConsortium();
    fullCatalog((c) => {
      c.opportunities = c.opportunities.map((o) => (o.id === answered.id ? { ...o, ...answered } : o));
    });
    renderDetail(CALL.consortium);

    expect(await screen.findByText(String(answered.score))).toBeInTheDocument();
    expect(screen.queryByText(/becsült|estimated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/van vagy építhető ilyen partnerséged/i)).not.toBeInTheDocument();
  });

  it("shows the exclusion reasons, and no calculator or apply panel, for a ruled-out call", async () => {
    fullCatalog();
    renderDetail(CALL.blocked);

    expect(await screen.findByText(/nem releváns|not relevant/i)).toBeInTheDocument();
    expect(screen.getByText(/kizáró feltételek|exclusion criteria/i)).toBeInTheDocument();
    expect(screen.getByText(detailOf("blocked").checks.find((c) => c.status === "fail")!.label)).toBeInTheDocument();
    expect(screen.queryByText(/támogatáskalkulátor|grant calculator/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hogyan pályázz|how to apply/i)).not.toBeInTheDocument();
  });

  it("shows the grant the server calculated for the profile's project value, read-only", async () => {
    fullCatalog();
    renderDetail(CALL.plain);

    const calc = detailOf("plain").calculator!;
    const input = await screen.findByLabelText(/tervezett projektérték|planned project value/i);
    expect(input).toHaveValue(formatHuf(calc.projectValueHuf, "hu"));
    expect(input).toBeDisabled();
    const out = screen.getByText(/várható támogatás|expected funding/i).closest("div")!;
    expect(out.textContent).toContain(formatHuf(calc.grantHuf, "hu"));
    expect(screen.getByRole("link", { name: /profil megnyitása|open profile/i })).toHaveAttribute("href", "/onboarding");
  });

  it("saves and unsaves a call (browser-only when anonymous)", async () => {
    fullCatalog();
    const user = userEvent.setup();
    renderDetail(CALL.plain);

    await user.click(await screen.findByRole("button", { name: /^elmentem$|^save$/i }));
    expect(useLocalSavedStore.getState().ids).toEqual([CALL.plain]);
    expect(screen.getByRole("button", { name: /elmentve|saved/i })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /elmentve|saved/i }));
    expect(useLocalSavedStore.getState().ids).toEqual([]);
  });

  it("opens a call the open-calls catalog doesn't hold by fetching it, already scored, from the server", async () => {
    fullCatalog();
    const forthcoming = { ...detailOf("plain"), id: "forthcoming-1", title: "A forthcoming call" };
    vi.mocked(useOpportunityDetailQuery).mockReturnValue({ data: forthcoming, isLoading: false } as never);
    renderDetail("forthcoming-1");

    expect(await screen.findByRole("heading", { level: 1, name: "A forthcoming call" })).toBeInTheDocument();
    expect(screen.getByText(String(forthcoming.score))).toBeInTheDocument();
    expect(vi.mocked(useOpportunityDetailQuery)).toHaveBeenCalledWith("forthcoming-1", true);
  });

  it("does not ask the server for a call that IS in the catalog", async () => {
    fullCatalog();
    renderDetail(CALL.plain);
    await screen.findByRole("heading", { level: 1 });
    expect(vi.mocked(useOpportunityDetailQuery)).toHaveBeenCalledWith(CALL.plain, false);
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
