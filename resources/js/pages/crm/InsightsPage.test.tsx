import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { crmApi } from "@/features/crm/api/crm.api";
import { METRICS, makeBoard } from "@/features/crm/testFixtures";
import { InsightsPage } from "@/pages/crm/InsightsPage";

vi.mock("@/features/crm/api/crm.api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/crm/api/crm.api")>()),
  crmApi: { board: vi.fn() },
}));

const TREND = [
  { key: "2026-07", year: 2026, month: 7, signups: 0, leads: 0, won: 0 },
  { key: "2026-08", year: 2026, month: 8, signups: 2, leads: 1, won: 0 },
  { key: "2026-09", year: 2026, month: 9, signups: 4, leads: 2, won: 1 },
];

const panel = (title: RegExp) => screen.getByRole("heading", { name: title }).closest("div.rounded-lg") as HTMLElement;

beforeEach(() => {
  vi.mocked(crmApi.board).mockReset().mockResolvedValue(
    makeBoard({
      trend: TREND,
      metrics: {
        ...METRICS,
        byPlan: { monthly: { count: 1, monthlyHuf: 5990 } },
        bySource: { signup: 2, assessment: 1 },
        byStage: { new: 2, won: 1 },
        warmUnsubscribed: [{ id: "u7", company: "Warm Kft.", username: "warm", lifecycle: "registered", score: 61, daysSinceActive: 3 }],
      },
    }),
  );
});

describe("InsightsPage — revenue the server doesn't know yet", () => {
  it("shows dashes for MRR, ARR and the average, and explains why once", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(
      makeBoard({ trend: TREND, metrics: { ...METRICS, mrrHuf: null, arrHuf: null, arpaHuf: null, pipelineValueHuf: null, byPlan: { monthly: { count: 1, monthlyHuf: null } } } }),
    );
    renderWithProviders(<InsightsPage />);
    const mrr = (await screen.findByText(/^mrr$/i)).parentElement!;
    expect(within(mrr).getByText("—")).toBeInTheDocument();
    expect(within(mrr).getByText(/csomagárak nincsenek beállítva|plan prices are not set/i)).toBeInTheDocument();
    expect(within(screen.getByText(/^arr$/i).parentElement!).getByText("—")).toBeInTheDocument();
    const plans = within(screen.getByRole("heading", { name: /bevétel csomag szerint|revenue by plan/i }).closest("div.rounded-lg") as HTMLElement);
    expect(plans.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/^0\s?(Ft|HUF)$/)).not.toBeInTheDocument();
  });
});

describe("InsightsPage", () => {
  it("states the revenue figures and what they mean", async () => {
    renderWithProviders(<InsightsPage />);
    const mrr = (await screen.findByText(/^mrr$/i)).parentElement!;
    expect(within(mrr).getByText(/5\D?990\s?(Ft|HUF)/)).toBeInTheDocument();
    const arr = screen.getByText(/^arr$/i).parentElement!;
    expect(within(arr).getByText(/71\D?880\s?(Ft|HUF)/)).toBeInTheDocument();
    expect(within(arr).getByText(/nem előrejelzés|not a forecast/i)).toBeInTheDocument();
  });

  it("shows trial conversion, or a dash and an honest note when no trial has finished", async () => {
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText("50%")).toBeInTheDocument();
    expect(screen.getByText(/1 a 2 próbából|1 of 2 trials/i)).toBeInTheDocument();
  });

  it("shows a dash rather than 0% when there is nothing to convert", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(makeBoard({ trend: TREND, metrics: { ...METRICS, trialConversionPct: null, trialStarted: 0, trialConverted: 0, subscribers: 0, arpaHuf: 0 } }));
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText(/még egy próba sem zárult le|no trial has completed yet/i)).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("draws the funnel from the server's counts", async () => {
    renderWithProviders(<InsightsPage />);
    const funnel = within(await screen.findByRole("heading", { name: /^tölcsér$|^funnel$/i }).then(() => panel(/^tölcsér$|^funnel$/i)));
    expect(funnel.getByText(/^érdeklődő$|^leads$/i).nextElementSibling).toBeTruthy();
    expect(funnel.getAllByRole("listitem")).toHaveLength(4);
  });

  it("lists revenue by plan and sources by name", async () => {
    renderWithProviders(<InsightsPage />);
    const plans = within(await screen.findByRole("heading", { name: /bevétel csomag szerint|revenue by plan/i }).then(() => panel(/bevétel csomag szerint|revenue by plan/i)));
    expect(plans.getByText(/havi előfizetés · 1|monthly subscription · 1/i)).toBeInTheDocument();
    const sources = within(panel(/honnan érkeztek|where they came from/i));
    expect(sources.getByText(/önálló regisztráció|self sign-up/i)).toBeInTheDocument();
    expect(sources.getByText(/ingyenes felmérés|free assessment/i)).toBeInTheDocument();
  });

  it("says so when no paid plan or source is recorded", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(makeBoard({ trend: TREND, metrics: { ...METRICS, byPlan: {}, bySource: {} } }));
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText(/még nincs aktív fizetős előfizetés|no paid subscription is active yet/i)).toBeInTheDocument();
    expect(screen.getByText(/még nincs rögzített forrás|no source recorded yet/i)).toBeInTheDocument();
  });

  it("draws a chart with an accessible name, a slot for every month — including the empty one — and its totals", async () => {
    renderWithProviders(<InsightsPage />);
    const chart = await screen.findByRole("img", { name: /havi új kapcsolatok|new contacts per month/i });
    expect(chart.querySelectorAll("g")).toHaveLength(3);
    const totals = [...chart.querySelectorAll("text")].map((t) => t.textContent).filter((t) => /^\d+$/.test(t ?? ""));
    expect(totals).toEqual(["0", "3", "6"]);
    const bars = [...chart.querySelectorAll("rect")];
    expect(bars.filter((r) => r.getAttribute("height") === "0")).toHaveLength(2);
  });

  it("names accounts that are active but unsubscribed, in call order, with a link to each", async () => {
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText("Warm Kft.")).toBeInTheDocument();
    expect(screen.getByText(/aktivitás 61|engagement 61/i)).toBeInTheDocument();
    expect(screen.getByText(/3 napja járt itt|last seen 3d ago/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /megnyitás|open/i })).toHaveAttribute("href", "/admin/crm/contact/u7");
  });

  it("says so when there is nobody in that position", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(makeBoard({ trend: TREND }));
    renderWithProviders(<InsightsPage />);
    expect(await screen.findByText(/jelenleg nincs ilyen fiók|no account is in that position/i)).toBeInTheDocument();
  });
});
