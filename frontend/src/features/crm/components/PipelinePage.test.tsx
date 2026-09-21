import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { crmApi } from "../api/crm.api";
import { METRICS, makeBoard, makeContact, makeLead } from "../testFixtures";
import type { OpenTask } from "../types/crm.types";
import { PipelinePage } from "./PipelinePage";

vi.mock("../api/crm.api", () => ({
  crmApi: { board: vi.fn(), contact: vi.fn(), updateContact: vi.fn(), addNote: vi.fn(), deleteNote: vi.fn(), addTask: vi.fn(), setTaskDone: vi.fn(), deleteTask: vi.fn(), deleteLead: vi.fn() },
}));

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const openTask = (over: Partial<OpenTask>): OpenTask => ({
  id: "t1", at: "2026-09-01T00:00:00.000Z", by: "admin", title: "Call back", dueAt: null, doneAt: null, doneBy: null,
  subjectId: "u1", subjectKind: "account", company: "Kata Kft.", username: "kata", ...over,
});

const column = (name: RegExp) => screen.getByRole("region", { name });

beforeEach(() => {
  vi.mocked(crmApi.updateContact).mockReset().mockResolvedValue({ success: true });
  vi.mocked(crmApi.board).mockResolvedValue(
    makeBoard({ board: { new: [makeContact()], contacted: [makeLead()], won: [], lost: [] } }),
  );
});

describe("PipelinePage — headline numbers", () => {
  it("shows MRR in full, with the subscriber count and ARR", async () => {
    renderWithProviders(<PipelinePage />);
    expect(await screen.findByText(/5\D?990\s?(Ft|HUF)/, { selector: "div.font-display" })).toBeInTheDocument();
    expect(screen.getByText(/1 előfizető|1 subscribers/i)).toHaveTextContent(/71\D?880/);
  });

  it("reports trial conversion from the figures the server counted", async () => {
    renderWithProviders(<PipelinePage />);
    expect(await screen.findByText(/átváltás: 50% \(1\/2\)|converted so far: 50% \(1\/2\)/i)).toBeInTheDocument();
  });

  it("says 'no completed trial yet' instead of 0% when there is no data", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(makeBoard({ metrics: { ...METRICS, trialConversionPct: null, trialStarted: 0, trialConverted: 0 } }));
    renderWithProviders(<PipelinePage />);
    expect(await screen.findByText(/még nincs lezárt próba|no completed trial yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument();
  });

  it("says there is nothing to churn from yet, rather than 0%", async () => {
    renderWithProviders(<PipelinePage />);
    expect(await screen.findByText(/még nincs miből lemorzsolódni|nothing to churn from yet/i)).toBeInTheDocument();
  });

  it("counts overdue tasks and those due today", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(
      makeBoard({ tasks: [openTask({ id: "a", dueAt: daysFromNow(-3) }), openTask({ id: "b", dueAt: daysFromNow(-1) }), openTask({ id: "c", dueAt: new Date().toISOString() })] }),
    );
    renderWithProviders(<PipelinePage />);
    const tile = (await screen.findByText(/^lejárt teendő$|^overdue tasks$/i)).parentElement!;
    expect(within(tile).getByText("2")).toBeInTheDocument();
    expect(within(tile).getByText(/ma esedékes: 1|due today: 1/i)).toBeInTheDocument();
  });
});

describe("PipelinePage — revenue the server doesn't know yet", () => {
  const unknown = { ...METRICS, mrrHuf: null, arrHuf: null, arpaHuf: null, pipelineValueHuf: null };

  it("shows a dash and says why, instead of a made-up 0 Ft", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(makeBoard({ metrics: unknown }));
    renderWithProviders(<PipelinePage />);
    const mrr = (await screen.findByText(/^mrr$/i)).parentElement!;
    expect(within(mrr).getByText("—")).toBeInTheDocument();
    expect(within(mrr).getByText(/csomagárak nincsenek beállítva|plan prices are not set/i)).toBeInTheDocument();
    expect(screen.queryByText(/^0\s?(Ft|HUF)$/)).not.toBeInTheDocument();
  });

  it("shows a dash for the expected value of open deals too", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(makeBoard({ metrics: unknown }));
    renderWithProviders(<PipelinePage />);
    expect(await screen.findByText(/várható érték: —|expected value: —/i)).toBeInTheDocument();
  });
});

describe("PipelinePage — overdue follow-ups", () => {
  it("lists what is late, with whose it is and a link to them", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(makeBoard({ tasks: [openTask({ dueAt: daysFromNow(-2), title: "Send the quote" })] }));
    renderWithProviders(<PipelinePage />);
    expect(await screen.findByRole("heading", { name: /lejárt teendők|overdue follow-ups/i })).toBeInTheDocument();
    expect(screen.getByText("Send the quote")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /megnyitás|open/i })).toHaveAttribute("href", "/admin/crm/contact/u1");
  });

  it("is absent when nothing is late", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(makeBoard({ tasks: [openTask({ dueAt: daysFromNow(5) })] }));
    renderWithProviders(<PipelinePage />);
    await screen.findByText(/^mrr$/i);
    expect(screen.queryByRole("heading", { name: /lejárt teendők|overdue follow-ups/i })).not.toBeInTheDocument();
  });
});

describe("PipelinePage — the board", () => {
  it("has a column per stage, each deal in its stage, with counts", async () => {
    renderWithProviders(<PipelinePage />);
    await screen.findByText("Kata Kft.");
    expect(within(column(/^új$|^new$/i)).getByText("Kata Kft.")).toBeInTheDocument();
    expect(within(column(/^megkeresve$|^contacted$/i)).getByText("Lead Bt.")).toBeInTheDocument();
    expect(within(column(/^megnyert$|^won$/i)).getByText(/^üres$|^empty$/i)).toBeInTheDocument();
  });

  it("shows a lead's assessment score where an account shows engagement", async () => {
    renderWithProviders(<PipelinePage />);
    await screen.findByText("Lead Bt.");
    expect(within(column(/^megkeresve$|^contacted$/i)).getByText(/88 · felmérés|88 · assessment/i)).toBeInTheDocument();
    expect(within(column(/^új$|^new$/i)).getByText(/42 · mérsékelt|42 · moderate/i)).toBeInTheDocument();
  });

  it("links a card to the contact's page and flags an overdue next step", async () => {
    vi.mocked(crmApi.board).mockResolvedValue(
      makeBoard({ board: { new: [makeContact({ nextTask: { id: "t", at: "", by: null, title: "Ring them", dueAt: daysFromNow(-1), doneAt: null, doneBy: null }, overdueTasks: 1 })], contacted: [], won: [], lost: [] } }),
    );
    renderWithProviders(<PipelinePage />);
    expect(await screen.findByRole("link", { name: "Kata Kft." })).toHaveAttribute("href", "/admin/crm/contact/u1");
    expect(screen.getByText(/Ring them/).closest("div")).toHaveClass("text-red");
  });

  it("moves a deal with the dropdown on its card", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PipelinePage />);
    await screen.findByText("Kata Kft.");
    await user.selectOptions(within(column(/^új$|^new$/i)).getByRole("combobox"), "won");
    await waitFor(() => expect(crmApi.updateContact).toHaveBeenCalledWith({ id: "u1", stage: "won" }));
  });

  it("reloads the board after a move, since the derived numbers may have changed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PipelinePage />);
    await screen.findByText("Kata Kft.");
    await user.selectOptions(within(column(/^új$|^new$/i)).getByRole("combobox"), "won");
    await waitFor(() => expect(crmApi.board).toHaveBeenCalledTimes(2));
  });
});

describe("PipelinePage — drag and drop", () => {
  function drag(card: HTMLElement, toColumn: HTMLElement) {
    const data: Record<string, string> = {};
    const dataTransfer = { setData: (k: string, v: string) => (data[k] = v), getData: (k: string) => data[k], effectAllowed: "", dropEffect: "" };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(toColumn, { dataTransfer });
    fireEvent.drop(toColumn, { dataTransfer });
  }

  it("dropping a card on another column moves it there", async () => {
    renderWithProviders(<PipelinePage />);
    const card = (await screen.findByText("Kata Kft.")).closest("[draggable]") as HTMLElement;
    drag(card, column(/^megnyert$|^won$/i));
    await waitFor(() => expect(crmApi.updateContact).toHaveBeenCalledWith({ id: "u1", stage: "won" }));
  });

  it("dropping a card back on its own column does nothing — that would only reset its days in stage", async () => {
    renderWithProviders(<PipelinePage />);
    const card = (await screen.findByText("Kata Kft.")).closest("[draggable]") as HTMLElement;
    drag(card, column(/^új$|^new$/i));
    await new Promise((r) => setTimeout(r, 50));
    expect(crmApi.updateContact).not.toHaveBeenCalled();
  });
});

describe("PipelinePage — losing a deal", () => {
  async function pickLost() {
    const user = userEvent.setup();
    renderWithProviders(<PipelinePage />);
    await screen.findByText("Kata Kft.");
    await user.selectOptions(within(column(/^új$|^new$/i)).getByRole("combobox"), "lost");
    return user;
  }

  it("asks why before moving it, and moves nothing yet", async () => {
    await pickLost();
    expect(await screen.findByRole("dialog", { name: /miért veszett el|why was it lost/i })).toBeInTheDocument();
    expect(crmApi.updateContact).not.toHaveBeenCalled();
  });

  it("records the reason with the move", async () => {
    const user = await pickLost();
    await user.type(await screen.findByLabelText(/indok|reason/i), "went with a competitor");
    await user.click(screen.getByRole("button", { name: /elveszettnek jelölöm|mark as lost/i }));
    await waitFor(() => expect(crmApi.updateContact).toHaveBeenCalledWith({ id: "u1", stage: "lost", lostReason: "went with a competitor" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets you skip the reason", async () => {
    const user = await pickLost();
    await user.click(await screen.findByRole("button", { name: /elveszettnek jelölöm|mark as lost/i }));
    await waitFor(() => expect(crmApi.updateContact).toHaveBeenCalledWith({ id: "u1", stage: "lost", lostReason: undefined }));
  });

  it("cancelling moves nothing", async () => {
    const user = await pickLost();
    await user.click(await screen.findByRole("button", { name: /^mégse$|^cancel$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(crmApi.updateContact).not.toHaveBeenCalled();
  });
});

describe("PipelinePage — failures", () => {
  it("says why the board could not load", async () => {
    vi.mocked(crmApi.board).mockRejectedValue(new Error("boom"));
    renderWithProviders(<PipelinePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });

  it("shows the server's message when a move is refused", async () => {
    vi.mocked(crmApi.updateContact).mockRejectedValue({ isAxiosError: true, message: "x", response: { status: 400, data: { error: "Ismeretlen szakasz", code: "UNKNOWN_STAGE" } } });
    const user = userEvent.setup();
    renderWithProviders(<PipelinePage />);
    await screen.findByText("Kata Kft.");
    await user.selectOptions(within(column(/^új$|^new$/i)).getByRole("combobox"), "won");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
