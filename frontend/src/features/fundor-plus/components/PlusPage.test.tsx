import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscriberCatalog } from "@/test/apiFixtures";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated, useIsSubscriber } from "@/shared/hooks/useAuth";
import { useCatalog } from "@/features/opportunities/api/opportunities.queries";
import { DEMO_PROFILE } from "@/shared/data/demoProfile";
import { useLocalProfileStore } from "@/shared/store/localProfileStore";
import { formatHuf } from "@/shared/lib/format";
import { metaApi } from "@/shared/api/meta.api";
import { useUiStore } from "@/shared/store/uiStore";
import { useDocChecksStore } from "../store/docChecksStore";
import { PlusPage } from "./PlusPage";

vi.mock("@/shared/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn(), useIsSubscriber: vi.fn() }));
vi.mock("@/shared/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));
vi.mock("@/features/opportunities/api/opportunities.queries", () => ({
  useCatalog: vi.fn(),
  useSearchQuery: vi.fn(),
  useOpportunityDetailQuery: vi.fn(),
  opportunitiesKeys: { all: ["opportunities"] },
}));

const META = {
  today: "2026-09-07",
  reference: {
    regions: [{ code: "HU12", name: "Pest megye", counties: ["Pest"] }],
    goals: [
      { id: "digitalization", label: "Digitalizáció", label_en: "Digitalisation" },
      { id: "energy", label: "Energia", label_en: "Energy" },
    ],
    industries: [],
    revBands: [],
    orgTypes: [],
  },
} as never;

/** The real scored subscriber catalog; `opportunities` replaces its rows for a test that needs different ones. */
function fullCatalog(opportunities: ReturnType<typeof subscriberCatalog>["opportunities"] = subscriberCatalog().opportunities) {
  const catalog = { ...subscriberCatalog(), opportunities };
  vi.mocked(useCatalog).mockReturnValue({ catalog, isLoading: false, error: null } as never);
}

const picker = () => screen.getByRole("heading", { name: /válassz pályázatot|select grant/i }).closest("div.rounded-lg") as HTMLElement;
const options = () => within(picker()).getAllByRole("button");
const generate = () => screen.getByRole("button", { name: /vázlat készítése|generate draft/i });

beforeEach(() => {
  vi.mocked(useIsSubscriber).mockReturnValue(true);
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  vi.mocked(metaApi.get).mockResolvedValue(META);
  useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
  useDocChecksStore.setState({ checks: {} });
  useUiStore.getState().setLang("hu");
  fullCatalog();
});

afterEach(() => vi.restoreAllMocks());

describe("PlusPage — who may open it", () => {
  it("gives a subscriber the workspace", async () => {
    renderWithProviders(<PlusPage />);
    expect(await screen.findByRole("heading", { name: /válassz pályázatot|select grant/i })).toBeInTheDocument();
    expect(screen.getByText(/előnézet aktív \(demó\)|preview active \(demo\)/i)).toBeInTheDocument();
  });

  it("gives everyone else an honest description — with no switch to unlock it", async () => {
    vi.mocked(useIsSubscriber).mockReturnValue(false);
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    renderWithProviders(<PlusPage />);

    expect(await screen.findByRole("heading", { name: /indítsd el a pályázatot|start the application/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText(/nem egyedi ai-szövegírás|not custom ai writing/i)).toBeInTheDocument();
    expect(screen.getByText(/adminisztrátor adja meg|granted by an administrator/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /aktiv|activat/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /válassz pályázatot|select grant/i })).not.toBeInTheDocument();
  });

  it("offers a visitor with no account the way to make one, and a signed-in one nothing to click", async () => {
    vi.mocked(useIsSubscriber).mockReturnValue(false);
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    const { unmount } = renderWithProviders(<PlusPage />);
    expect(await screen.findByRole("link", { name: /cégfiók létrehozása|create a company account/i })).toHaveAttribute("href", "/register");
    unmount();

    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    renderWithProviders(<PlusPage />);
    await screen.findByRole("heading", { name: /indítsd el a pályázatot|start the application/i });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("PlusWorkspace — choosing a call", () => {
  it("lists the calls that fit the company, best first, with the first one selected", async () => {
    renderWithProviders(<PlusPage />);
    await screen.findByRole("heading", { name: /válassz pályázatot|select grant/i });
    const buttons = options();
    expect(buttons.length).toBeGreaterThan(1);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");
    const scores = buttons.map((b) => Number(b.querySelector("span:last-child")?.textContent));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("shows the selected call's program and title above the draft area", async () => {
    renderWithProviders(<PlusPage />);
    await screen.findByRole("heading", { name: /válassz pályázatot|select grant/i });
    const title = options()[0].textContent!.replace(/\d+$/, "");
    expect(screen.getAllByRole("heading", { level: 2 }).some((h) => h.textContent === title)).toBe(true);
  });

  it("says so when nothing fits, instead of showing an empty workspace", async () => {
    fullCatalog([]);
    renderWithProviders(<PlusPage />);
    expect(await screen.findByText(/még nincs felhívás|no call to work on yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /vázlat készítése|generate draft/i })).not.toBeInTheDocument();
  });

  it("shows the loading line while the catalog loads", async () => {
    vi.mocked(useCatalog).mockReturnValue({ catalog: undefined, isLoading: true, error: null } as never);
    renderWithProviders(<PlusPage />);
    expect(await screen.findByText(/betöltés|loading/i)).toBeInTheDocument();
    expect(screen.queryByText(/még nincs felhívás|no call to work on yet/i)).not.toBeInTheDocument();
  });
});

describe("PlusWorkspace — the demo draft", () => {
  it("starts with an invitation and the honest notice, and no text", async () => {
    renderWithProviders(<PlusPage />);
    expect(await screen.findByText(/készen áll|ready to draft/i)).toBeInTheDocument();
    expect(screen.getAllByText(/nem egyedi ai-generálás|not custom ai generation/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { level: 3, name: /vezetői összefoglaló|executive summary/i })).not.toBeInTheDocument();
  });

  it("writes three chapters from the company's real figures, each marked as a demo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());

    const chapters = screen.getAllByRole("heading", { level: 3 }).filter((h) => /demó|demo/.test(h.textContent ?? ""));
    expect(chapters).toHaveLength(3);
    const text = chapters.map((h) => h.parentElement!.textContent).join(" ");
    expect(text).toContain(DEMO_PROFILE.company);
    expect(text).toContain(String(DEMO_PROFILE.employees));
    expect(text).toContain(DEMO_PROFILE.county);
    expect(text).not.toMatch(/undefined|NaN|\{\{/);
  });

  it("quotes the grant and own contribution the server calculated for the selected call", async () => {
    const user = userEvent.setup();
    const catalog = subscriberCatalog();
    const first = catalog.opportunities.filter((o) => !o.blocked && o.awardsFunding !== false).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());

    const summary = (await screen.findByRole("heading", { level: 3, name: /vezetői összefoglaló/i })).parentElement!.textContent!;
    expect(summary).toContain(formatHuf(first.calculator!.grantHuf, "hu"));
  });

  it("names the call's goals, not their ids", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());
    const technical = (await screen.findByRole("heading", { level: 3, name: /szakmai megvalósítás|technical implementation/i })).parentElement!;
    expect(technical.textContent).not.toMatch(/\b(digitalization|energy|circular|environment)\b/);
  });

  it("re-words the draft when the language changes, without asking for it again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());
    expect(await screen.findByRole("heading", { level: 3, name: /vezetői összefoglaló/i })).toBeInTheDocument();

    useUiStore.getState().setLang("en");
    expect(await screen.findByRole("heading", { level: 3, name: /executive summary/i })).toBeInTheDocument();
  });

  it("drops a previous draft when another call is picked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());
    expect(await screen.findByRole("heading", { level: 3, name: /vezetői összefoglaló|executive summary/i })).toBeInTheDocument();

    await user.click(options()[1]);
    expect(await screen.findByText(/készen áll|ready to draft/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: /vezetői összefoglaló|executive summary/i })).not.toBeInTheDocument();
    expect(options()[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("leaves the activity sentence out, rather than print 'undefined', when the profile has no activity code", async () => {
    useLocalProfileStore.getState().setProfile({ ...DEMO_PROFILE, teaor: undefined });
    const user = userEvent.setup();
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());
    const technical = (await screen.findByRole("heading", { level: 3, name: /szakmai megvalósítás|technical implementation/i })).parentElement!;
    expect(technical.textContent).not.toMatch(/undefined/);
    expect(technical.textContent).not.toMatch(/TEÁOR|NACE/);
  });
});

describe("PlusWorkspace — copy and print", () => {
  it("copies the notice and every chapter to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());
    await user.click(await screen.findByRole("button", { name: /vágólapra másolás|copy to clipboard/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toMatch(/^Pályázati vázlat \(demó\)/);
    expect(copied).toContain("1. Vezetői összefoglaló");
    expect(copied).toContain("3. Költségvetési terv");
    expect(await screen.findByRole("status")).toHaveTextContent(/vázlat másolva|draft copied/i);
  });

  it("says so when the clipboard is unavailable", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());
    await user.click(await screen.findByRole("button", { name: /vágólapra másolás|copy to clipboard/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/nem sikerült|couldn't copy/i);
  });

  it("prints", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<PlusPage />);
    await screen.findByText(/készen áll|ready to draft/i);
    await user.click(generate());
    await user.click(await screen.findByRole("button", { name: /nyomtatás|print/i }));
    expect(print).toHaveBeenCalledTimes(1);
  });
});

describe("PlusWorkspace — required documents", () => {
  it("lists the selected call's documents and ticks them, remembering per document", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlusPage />);
    await screen.findByRole("heading", { name: /kötelező dokumentumok|required documents/i });
    const box = within(screen.getByRole("heading", { name: /kötelező dokumentumok|required documents/i }).closest("div.rounded-lg") as HTMLElement);
    const checkboxes = box.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
    expect(checkboxes[0]).not.toBeChecked();

    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
    expect(Object.keys(useDocChecksStore.getState().checks)).toHaveLength(1);
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
    expect(useDocChecksStore.getState().checks).toEqual({});
  });

  it("says so for a call that lists no documents", async () => {
    fullCatalog(subscriberCatalog().opportunities.map((o) => ({ ...o, docs: [] })));
    renderWithProviders(<PlusPage />);
    expect(await screen.findByText(/nem sorol fel|lists no separate documents/i)).toBeInTheDocument();
  });
});
