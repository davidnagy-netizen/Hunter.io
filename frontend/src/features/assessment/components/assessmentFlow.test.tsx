import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useCurrentUser, useIsAuthenticated } from "@/shared/hooks/useAuth";
import { opportunitiesApi } from "@/features/opportunities/api/opportunities.api";
import { useOnboardingDraftStore } from "@/shared/store/onboardingDraftStore";
import { metaApi } from "@/shared/api/meta.api";
import { leadsApi } from "../api/leads.api";
import { AssessmentPage } from "./AssessmentPage";

vi.mock("@/shared/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn(), useCurrentUser: vi.fn() }));
vi.mock("@/shared/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));
vi.mock("@/features/opportunities/api/opportunities.api", () => ({
  opportunitiesApi: { catalog: vi.fn(), catalogFor: vi.fn(), search: vi.fn(), searchFor: vi.fn(), detail: vi.fn(), toggleSaved: vi.fn() },
}));
vi.mock("../api/leads.api", () => ({ leadsApi: { submit: vi.fn() } }));
// Skip the presentational timing; the loader's own tests cover it.
vi.mock("@/shared/components/MatchingLoader", () => ({
  MatchingLoader: ({ onAnimationDone }: { onAnimationDone?: () => void }) => {
    queueMicrotask(() => onAnimationDone?.());
    return <div role="status">loading</div>;
  },
}));

const META = {
  today: "2026-09-07",
  reference: {
    regions: [{ code: "HU12", name: "Pest megye", counties: ["Pest"] }],
    industries: [{ id: "manuf", label: "Gyártás / feldolgozóipar", teaor: "28" }],
    goals: [{ id: "digitalization", label: "Digitalizáció", label_en: "Digitalisation" }],
    revBands: [],
    orgTypes: [],
  },
} as never;

const TEASER = (i: number) => ({ ref: `t${i}`, locked: true, score: 80 - i, band: null, estimated: false, grantHuf: 24e6, fundingMax: null, intensity: 0.8, closingSoon: false });
const gatedCatalog = (n = 6) =>
  ({ gated: true, total: 0, lockedTotal: 175, opportunities: [], teasers: Array.from({ length: n }, (_, i) => TEASER(i)), stats: { eligible: 187 } }) as never;

const next = () => screen.getByRole("button", { name: /^következő$|^next$|eredményem megnézése|see my result/i });

/** Walks the six questions with the same answers each time. */
async function answerEverything(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /16–50/ }));
  await user.click(next());
  await user.selectOptions(await screen.findByRole("combobox"), "Pest");
  await user.click(next());
  await user.click(await screen.findByRole("button", { name: /gyártás|manufacturing/i }));
  await user.click(next());
  await user.click(await screen.findByRole("button", { name: /2 vagy több|2 or more/i }));
  await user.click(next());
  await user.click(await screen.findByRole("button", { name: /digitaliz/i }));
  await user.click(next());
  await user.click(await screen.findByRole("button", { name: /30–100/ }));
  await user.click(next());
}

function renderFunnel() {
  return renderWithProviders(
    <Routes>
      <Route path="/assess" element={<AssessmentPage />} />
      <Route path="/app" element={<p>the app</p>} />
      <Route path="/admin" element={<p>the console</p>} />
      <Route path="/onboarding" element={<p>onboarding</p>} />
      <Route path="/" element={<p>landing</p>} />
    </Routes>,
    { route: "/assess" },
  );
}

beforeEach(() => {
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  vi.mocked(useCurrentUser).mockReturnValue(null);
  vi.mocked(metaApi.get).mockResolvedValue(META);
  vi.mocked(opportunitiesApi.catalogFor).mockResolvedValue(gatedCatalog());
  vi.mocked(leadsApi.submit).mockReset();
  useOnboardingDraftStore.getState().clear();
});

describe("AssessmentPage", () => {
  it("won't advance until a question is answered, and counts the steps", async () => {
    const user = userEvent.setup();
    renderFunnel();

    expect(await screen.findByText(/1\/6/)).toBeInTheDocument();
    expect(next()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /16–50/ }));
    expect(next()).toBeEnabled();
    await user.click(next());
    expect(await screen.findByText(/2\/6/)).toBeInTheDocument();
    expect(next()).toBeDisabled();
  });

  it("lets you go back and keeps the earlier answer", async () => {
    const user = userEvent.setup();
    renderFunnel();
    await user.click(await screen.findByRole("button", { name: /16–50/ }));
    await user.click(next());
    await user.click(await screen.findByRole("button", { name: /^vissza$|^back$/i }));
    expect(await screen.findByRole("button", { name: /16–50/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("scores the answers server-side as a whole profile, then shows the readiness score, the real count and at most four teasers", async () => {
    const user = userEvent.setup();
    renderFunnel();
    await answerEverything(user);

    // 40 + 12 + 6 (30 staff) + 10 + 8 (4 closed years) + 10 (goal) + 8 (60M) + 6 (not Budapest) = 100, capped at 97.
    expect(await screen.findByText("97")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/187/);
    expect(screen.getAllByRole("article")).toHaveLength(4);

    const [profile, lang] = vi.mocked(opportunitiesApi.catalogFor).mock.calls[0];
    expect(profile).toMatchObject({ employees: 30, county: "Pest", region: "HU12", teaor: "28", closed_business_years: 4, investment_value: 60e6, orgType: "sme" });
    expect(lang).toBe("hu");
  });

  it("says so when the matches can't be loaded, instead of claiming 0 calls", async () => {
    vi.mocked(opportunitiesApi.catalogFor).mockRejectedValue(new Error("down"));
    const user = userEvent.setup();
    renderFunnel();
    await answerEverything(user);

    expect(await screen.findByText("97")).toBeInTheDocument(); // the readiness score doesn't need the server
    expect(await screen.findByRole("alert")).toHaveTextContent(/nem sikerült|couldn't load/i);
    expect(screen.queryByText(/0 felhívás|0 calls/)).not.toBeInTheDocument();
  });

  it("hands the visitor's answers to onboarding as a draft, not as a profile", async () => {
    const user = userEvent.setup();
    renderFunnel();
    await answerEverything(user);
    await user.click(await screen.findByRole("button", { name: /hozzáférési lehetőségeket|view access options/i }));

    expect(await screen.findByText("onboarding")).toBeInTheDocument();
    const { draft } = useOnboardingDraftStore.getState();
    expect(draft).toMatchObject({ employees: 30, county: "Pest", industryId: "manuf", closed_business_years: 4, goals: ["digitalization"], investment_value: 60e6 });
    expect(draft).not.toHaveProperty("company"); // nothing invented
  });

  it("sends a signed-in visitor to the app instead", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(useCurrentUser).mockReturnValue({ role: "user" } as never);
    renderFunnel();
    expect(await screen.findByText("the app")).toBeInTheDocument();
  });

  it("sends a signed-in administrator to the console", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(useCurrentUser).mockReturnValue({ role: "admin" } as never);
    renderFunnel();
    expect(await screen.findByText("the console")).toBeInTheDocument();
  });

  it("cancelling goes back to the landing page", async () => {
    const user = userEvent.setup();
    renderFunnel();
    await user.click(await screen.findByRole("button", { name: /^mégse$|^cancel$/i }));
    expect(await screen.findByText("landing")).toBeInTheDocument();
  });
});

describe("lead capture", () => {
  async function reachResult() {
    const user = userEvent.setup();
    renderFunnel();
    await answerEverything(user);
    await screen.findByText("97");
    return user;
  }

  it("won't submit without an email and consent", async () => {
    const user = await reachResult();
    await user.click(screen.getByRole("button", { name: /kérem a megkeresést|ask for a follow-up/i }));

    expect(await screen.findByText(/adj meg egy e-mail|enter an email/i)).toBeInTheDocument();
    expect(screen.getByText(/hozzájárulás szükséges|need your consent/i)).toBeInTheDocument();
    expect(leadsApi.submit).not.toHaveBeenCalled();
  });

  it("won't submit without consent even with a good email", async () => {
    const user = await reachResult();
    await user.type(screen.getByLabelText(/e-mail cím|email address/i), "a@b.hu");
    await user.click(screen.getByRole("button", { name: /kérem a megkeresést|ask for a follow-up/i }));

    expect(await screen.findByText(/hozzájárulás szükséges|need your consent/i)).toBeInTheDocument();
    expect(leadsApi.submit).not.toHaveBeenCalled();
  });

  it("submits what the visitor actually gave — consent, readiness, answers, profile — and no invented match ids", async () => {
    vi.mocked(leadsApi.submit).mockResolvedValue({ success: true, id: "l1", updated: false });
    const user = await reachResult();
    await user.type(screen.getByLabelText(/e-mail cím|email address/i), "vera@example.com");
    await user.type(screen.getByLabelText(/^cégnév|^company/i), "Vera Kft.");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /kérem a megkeresést|ask for a follow-up/i }));

    await waitFor(() => expect(leadsApi.submit).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(leadsApi.submit).mock.calls[0][0];
    expect(payload).toMatchObject({ email: "vera@example.com", company: "Vera Kft.", consent: true, readiness: 97 });
    expect(payload.answers).toMatchObject({ employees: 30, county: "Pest" });
    expect(payload.profile).toMatchObject({ employees: 30 });
    expect(payload).not.toHaveProperty("matchIds");
    expect(await screen.findByRole("status")).toHaveTextContent(/köszönjük|thank you/i);
  });

  it("shows the server's translated error when it rejects the lead", async () => {
    vi.mocked(leadsApi.submit).mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { error: "x", code: "INVALID_EMAIL" } } });
    const user = await reachResult();
    await user.type(screen.getByLabelText(/e-mail cím|email address/i), "a@b.hu");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /kérem a megkeresést|ask for a follow-up/i }));

    expect(await screen.findByText(/nem érvényes|not valid/i)).toBeInTheDocument();
  });
});
