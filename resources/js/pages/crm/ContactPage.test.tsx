import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { adminApi } from "@/features/admin/api/admin.api";
import { makeUser } from "@/features/admin/testFixtures";
import { metaApi } from "@/api/meta.api";
import type { MetaResponse } from "@/types/reference.types";
import { crmApi } from "@/features/crm/api/crm.api";
import { makeContact, makeDetail, makeLead } from "@/features/crm/testFixtures";
import { ContactPage } from "@/pages/crm/ContactPage";

vi.mock("@/features/crm/api/crm.api", () => ({
  crmApi: { board: vi.fn(), contact: vi.fn(), updateContact: vi.fn(), addNote: vi.fn(), deleteNote: vi.fn(), addTask: vi.fn(), setTaskDone: vi.fn(), deleteTask: vi.fn(), deleteLead: vi.fn() },
}));
vi.mock("@/features/admin/api/admin.api", () => ({
  adminApi: { overview: vi.fn(), users: vi.fn(), history: vi.fn(), grant: vi.fn(), revoke: vi.fn(), patchUser: vi.fn(), refreshCatalog: vi.fn() },
}));
vi.mock("@/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));

const META = {
  catalog: null,
  reference: { regions: [], industries: [], goals: [{ id: "digitalization", label: "Digitalizáció", label_en: "Digitalisation" }], revBands: [], orgTypes: [] },
  labels: { programmes: {}, actions: {} },
  optionalProfileFields: [],
  today: "2026-09-20",
} as MetaResponse;

function renderContact(id = "u1") {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/crm/contact/:id" element={<ContactPage />} />
      <Route path="/admin/crm" element={<p>the board</p>} />
    </Routes>,
    { route: `/admin/crm/contact/${id}` },
  );
}

const panel = (title: RegExp) => screen.getByRole("heading", { name: title }).closest("div.rounded-lg") as HTMLElement;

beforeEach(() => {
  for (const fn of Object.values(crmApi)) vi.mocked(fn).mockReset();
  vi.mocked(adminApi.grant).mockReset();
  vi.mocked(adminApi.revoke).mockReset();
  vi.mocked(metaApi.get).mockResolvedValue(META);
  vi.mocked(crmApi.contact).mockResolvedValue(makeDetail());
  vi.mocked(crmApi.updateContact).mockResolvedValue({ success: true });
});

describe("ContactPage — the header", () => {
  it("names the account, how to reach them, and where they came from", async () => {
    renderContact();
    expect(await screen.findByRole("heading", { level: 1, name: "Kata Kft." })).toBeInTheDocument();
    expect(screen.getByText("kata · kata@example.com")).toBeInTheDocument();
    expect(screen.getByText(/önálló regisztráció|self sign-up/i)).toBeInTheDocument();
    expect(screen.getByText(/^regisztrált$|^registered$/i)).toBeInTheDocument();
  });

  it("asks for the account by the id in the URL", async () => {
    renderContact("u9");
    await screen.findByRole("heading", { level: 1 });
    expect(crmApi.contact).toHaveBeenCalledWith("u9");
  });

  it("links an account to its subscription and profile history", async () => {
    renderContact();
    expect(await screen.findByRole("link", { name: /előzmények|history/i })).toHaveAttribute("href", "/admin/users/u1");
  });

  it("shows why a deal was lost", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail({ contact: makeContact({ stage: "lost", lostReason: "too expensive" }) }));
    renderContact();
    expect(await screen.findByText(/too expensive/)).toBeInTheDocument();
  });

  it("moves the contact to another stage from the header", async () => {
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    await user.selectOptions(screen.getAllByRole("combobox", { name: /szakasz|stage/i })[0], "won");
    await waitFor(() => expect(crmApi.updateContact).toHaveBeenCalledWith({ id: "u1", stage: "won" }));
  });

  it("asks why when moving it to 'lost'", async () => {
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    await user.selectOptions(screen.getAllByRole("combobox", { name: /szakasz|stage/i })[0], "lost");
    await user.type(await screen.findByLabelText(/indok|reason/i), "no budget");
    await user.click(screen.getByRole("button", { name: /elveszettnek jelölöm|mark as lost/i }));
    await waitFor(() => expect(crmApi.updateContact).toHaveBeenCalledWith({ id: "u1", stage: "lost", lostReason: "no budget" }));
  });

  it("says so for a contact that doesn't exist", async () => {
    vi.mocked(crmApi.contact).mockRejectedValue({ isAxiosError: true, message: "x", response: { status: 404, data: { error: "Nincs ilyen kapcsolat.", code: "NO_SUCH_CONTACT" } } });
    renderContact();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /vissza a crm|back to the crm/i })).toHaveAttribute("href", "/admin/crm");
  });
});

describe("ContactPage — accounts and leads differ", () => {
  it("gives an account access and engagement panels", async () => {
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("heading", { name: /^hozzáférés$|^access$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^aktivitás$|^engagement$/i })).toBeInTheDocument();
  });

  it("gives a lead neither — it has no account to grant access to or activity to count — but a delete button and its assessment score", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail({ contact: makeLead(), profile: { employees: 30, county: "Pest" } }));
    renderContact("l1");
    await screen.findByRole("heading", { level: 1, name: "Lead Bt." });
    expect(screen.queryByRole("heading", { name: /^hozzáférés$|^access$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^aktivitás$|^engagement$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /előzmények|history/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /érdeklődő törlése|delete lead/i })).toBeInTheDocument();
    expect(screen.getByText("88 / 100")).toBeInTheDocument();
  });

  it("deletes a lead only after confirming, then returns to the board", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail({ contact: makeLead() }));
    vi.mocked(crmApi.deleteLead).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderContact("l1");

    await user.click(await screen.findByRole("button", { name: /érdeklődő törlése|delete lead/i }));
    expect(crmApi.deleteLead).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^törlés$|^delete$/i }));

    await waitFor(() => expect(crmApi.deleteLead).toHaveBeenCalledWith("l1"));
    expect(await screen.findByText("the board")).toBeInTheDocument();
  });

  it("backing out of the delete confirmation deletes nothing", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail({ contact: makeLead() }));
    const user = userEvent.setup();
    renderContact("l1");
    await user.click(await screen.findByRole("button", { name: /érdeklődő törlése|delete lead/i }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /^mégse$|^cancel$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(crmApi.deleteLead).not.toHaveBeenCalled();
  });
});

describe("ContactPage — notes", () => {
  it("refuses an empty note", async () => {
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    await user.click(within(panel(/^feljegyzések$|^notes$/i)).getByRole("button", { name: /rögzítés|save/i }));
    expect(await screen.findByText(/nem lehet üres|cannot be empty/i)).toBeInTheDocument();
    expect(crmApi.addNote).not.toHaveBeenCalled();
  });

  it("saves a note with its kind and clears the box", async () => {
    vi.mocked(crmApi.addNote).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    const notes = within(panel(/^feljegyzések$|^notes$/i));

    await user.type(notes.getByPlaceholderText(/mi hangzott el|what was said/i), "Wants a quote by Friday");
    await user.selectOptions(notes.getByRole("combobox", { name: /típus|kind/i }), "call");
    await user.click(notes.getByRole("button", { name: /rögzítés|save/i }));

    await waitFor(() => expect(crmApi.addNote).toHaveBeenCalledWith({ id: "u1", text: "Wants a quote by Friday", kind: "call" }));
    await waitFor(() => expect(notes.getByPlaceholderText(/mi hangzott el|what was said/i)).toHaveValue(""));
  });

  it("lists notes with kind, author and body, and deletes one", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(
      makeDetail({ notes: [{ id: "n1", at: "2026-09-18T09:00:00.000Z", by: "admin", kind: "decision", body: "Go ahead with monthly" }] }),
    );
    vi.mocked(crmApi.deleteNote).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderContact();
    const notes = within(await screen.findByRole("heading", { name: /^feljegyzések$|^notes$/i }).then(() => panel(/^feljegyzések$|^notes$/i)));

    expect(notes.getByText("Go ahead with monthly")).toBeInTheDocument();
    expect(notes.getByText(/^döntés$|^decision$/i, { selector: "b" })).toBeInTheDocument();
    await user.click(notes.getByRole("button", { name: /törlés|delete/i }));
    await waitFor(() => expect(crmApi.deleteNote).toHaveBeenCalledWith("u1", "n1"));
  });
});

describe("ContactPage — follow-ups", () => {
  const task = (over = {}) => ({ id: "t1", at: "2026-09-10T00:00:00.000Z", by: "admin", title: "Send the quote", dueAt: null, doneAt: null, doneBy: null, ...over });

  it("needs a title, but not a date", async () => {
    vi.mocked(crmApi.addTask).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    const tasks = within(panel(/^teendők$|^follow-ups$/i));

    await user.click(tasks.getByRole("button", { name: /hozzáadás|add/i }));
    expect(await tasks.findByText(/megnevezés kell|needs a title/i)).toBeInTheDocument();
    expect(crmApi.addTask).not.toHaveBeenCalled();

    await user.type(tasks.getByPlaceholderText(/következő lépés|next step/i), "Ring them");
    await user.click(tasks.getByRole("button", { name: /hozzáadás|add/i }));
    await waitFor(() => expect(crmApi.addTask).toHaveBeenCalledWith({ id: "u1", title: "Ring them", dueAt: undefined }));
  });

  it("sends the due date when one is chosen", async () => {
    vi.mocked(crmApi.addTask).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    const tasks = within(panel(/^teendők$|^follow-ups$/i));

    await user.type(tasks.getByPlaceholderText(/következő lépés|next step/i), "Ring them");
    await user.type(tasks.getByLabelText(/határidő|due date/i), "2026-10-05");
    await user.click(tasks.getByRole("button", { name: /hozzáadás|add/i }));
    await waitFor(() => expect(crmApi.addTask).toHaveBeenCalledWith({ id: "u1", title: "Ring them", dueAt: "2026-10-05" }));
  });

  it("ticks a task done and unticks it, and deletes one", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail({ tasks: [task(), task({ id: "t2", title: "Old", doneAt: "2026-09-11T00:00:00.000Z" })] }));
    vi.mocked(crmApi.setTaskDone).mockResolvedValue({ success: true });
    vi.mocked(crmApi.deleteTask).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderContact();
    await screen.findByText("Send the quote");
    const boxes = screen.getAllByRole("checkbox", { name: /kész|done/i });

    expect(boxes[0]).not.toBeChecked();
    expect(boxes[1]).toBeChecked();
    await user.click(boxes[0]);
    await waitFor(() => expect(crmApi.setTaskDone).toHaveBeenCalledWith("u1", "t1", true));
    await user.click(boxes[1]);
    await waitFor(() => expect(crmApi.setTaskDone).toHaveBeenCalledWith("u1", "t2", false));
    await user.click(within(screen.getByText("Send the quote").closest("li")!).getByRole("button", { name: /törlés|delete/i }));
    await waitFor(() => expect(crmApi.deleteTask).toHaveBeenCalledWith("u1", "t1"));
  });

  it("flags a late task, strikes through a finished one, and says when there is no date", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(
      makeDetail({ tasks: [task({ dueAt: "2020-01-01T00:00:00.000Z" }), task({ id: "t2", title: "Finished", dueAt: "2020-01-01T00:00:00.000Z", doneAt: "2020-01-02T00:00:00.000Z" }), task({ id: "t3", title: "Someday" })] }),
    );
    renderContact();
    await screen.findByText("Send the quote");
    expect(screen.getByText("Send the quote").nextElementSibling).toHaveClass("text-red");
    expect(screen.getByText("Finished")).toHaveClass("line-through");
    expect(screen.getByText("Finished").nextElementSibling).not.toHaveClass("text-red");
    expect(screen.getByText("Someday").nextElementSibling).toHaveTextContent(/nincs határidő|no due date/i);
  });
});

describe("ContactPage — classification", () => {
  it("saves the owner and the tags as a list", async () => {
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    const box = within(panel(/^besorolás$|^classification$/i));

    await user.type(box.getByLabelText(/felelős|owner/i), "Zoltan");
    await user.type(box.getByLabelText(/címkék|tags/i), "vip,  warm , ");
    await user.click(box.getByRole("button", { name: /mentés|save/i }));
    await waitFor(() => expect(crmApi.updateContact).toHaveBeenCalledWith({ id: "u1", owner: "Zoltan", tags: ["vip", "warm"] }));
  });

  it("starts from what is stored, and clearing it is sent as clearing it", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail({ contact: makeContact({ owner: "Zoltan", tags: ["vip", "warm"] }) }));
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    const box = within(panel(/^besorolás$|^classification$/i));

    expect(box.getByLabelText(/felelős|owner/i)).toHaveValue("Zoltan");
    expect(box.getByLabelText(/címkék|tags/i)).toHaveValue("vip, warm");
    await user.clear(box.getByLabelText(/felelős|owner/i));
    await user.clear(box.getByLabelText(/címkék|tags/i));
    await user.click(box.getByRole("button", { name: /mentés|save/i }));
    await waitFor(() => expect(crmApi.updateContact).toHaveBeenCalledWith({ id: "u1", owner: "", tags: [] }));
  });
});

describe("ContactPage — access", () => {
  it("grants access from here and reloads the contact so the lifecycle updates", async () => {
    vi.mocked(adminApi.grant).mockResolvedValue({ success: true, user: makeUser() });
    const user = userEvent.setup();
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    const access = within(panel(/^hozzáférés$|^access$/i));

    await user.selectOptions(access.getByLabelText(/^csomag$|^plan$/i), "monthly");
    await user.click(access.getByRole("button", { name: /hozzáférés megadása|grant access/i }));

    await waitFor(() => expect(adminApi.grant).toHaveBeenCalledWith({ userId: "u1", planId: "monthly", days: undefined, note: undefined }));
    await waitFor(() => expect(crmApi.contact).toHaveBeenCalledTimes(2));
  });

  it("shows what the subscription is worth and when it runs out, and offers revoke", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(
      makeDetail({ contact: makeContact({ lifecycle: "subscriber", monthlyValueHuf: 5990, subscription: { status: "active", plan: "monthly", active: true, validUntil: "2026-10-20T00:00:00.000Z", daysLeft: 30 } }) }),
    );
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    const access = within(panel(/^hozzáférés$|^access$/i));
    expect(access.getByText(/5\D?990\s?(Ft|HUF)/)).toBeInTheDocument();
    expect(access.getByText(/2026.*10.*20|20 Oct 2026/)).toBeInTheDocument();
    expect(access.getByRole("button", { name: /^visszavonás$|^revoke$/i })).toBeInTheDocument();
  });
});

describe("ContactPage — timeline, engagement and profile", () => {
  it("narrates what happened in plain words", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(
      makeDetail({
        timeline: [
          { at: "2026-09-19T10:00:00.000Z", kind: "note", type: "note.call", detail: { kind: "call", body: "Wants a quote" } },
          { at: "2026-09-18T10:00:00.000Z", kind: "subscription", type: "subscription.granted", detail: { plan: "monthly", days: 30, by: "admin" } },
          { at: "2026-09-17T10:00:00.000Z", kind: "activity", type: "opportunity.saved", detail: {} },
          { at: "2026-09-16T10:00:00.000Z", kind: "profile", type: "profile.version", detail: { changed: [{ field: "employees", from: 28, to: 45 }] } },
        ],
      }),
    );
    renderContact();
    const timeline = within(await screen.findByRole("heading", { name: /^idővonal$|^timeline$/i }).then(() => panel(/^idővonal$|^timeline$/i)));

    expect(timeline.getByText(/telefon rögzítve|call logged/i)).toBeInTheDocument();
    expect(timeline.getByText("Wants a quote")).toBeInTheDocument();
    expect(timeline.getByText(/előfizetés megadva|subscription granted/i)).toBeInTheDocument();
    expect(timeline.getByText(/monthly · (30 nap|30 days) · (kiosztotta|by)/i)).toBeInTheDocument();
    expect(timeline.getByText(/felhívás elmentve|call saved/i)).toBeInTheDocument();
    expect(timeline.getByText(/cégprofil módosult|company profile changed/i)).toBeInTheDocument();
    expect(timeline.getByText("28")).toBeInTheDocument();
    expect(timeline.getByText("45")).toBeInTheDocument();
  });

  it("says a profile version with no changes was the first save", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail({ timeline: [{ at: "2026-09-16T10:00:00.000Z", kind: "profile", type: "profile.version", detail: { changed: [] } }] }));
    renderContact();
    expect(await screen.findByText(/első mentés|first save/i)).toBeInTheDocument();
  });

  it("explains the engagement score row by row", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(
      makeDetail({
        contact: makeContact({ engagement: { score: 42, signals: [{ type: "search", count: 3, points: 6, label_hu: "Keresés", label_en: "Search" }], lastActiveAt: null, daysSinceActive: 2, window: 30, band: { key: "medium", label_hu: "Mérsékelt", label_en: "Moderate" } } }),
      }),
    );
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    const box = within(panel(/^aktivitás$|^engagement$/i));
    expect(box.getByText(/keresés · 3×|search · 3×/i)).toBeInTheDocument();
    expect(box.getByText("+6")).toBeInTheDocument();
    expect(box.getByText(/2 napja|2d ago/i)).toBeInTheDocument();
  });

  it("shows the company's profile, with goals by name — and treats no profile as a reason to call", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(
      makeDetail({ profile: { employees: 45, county: "Pest", investment_value: 60_000_000, goals: ["digitalization"], projectName: "Line 2" } }),
    );
    const { unmount } = renderContact();
    await screen.findByText("Line 2");
    expect(screen.getByText("Pest")).toBeInTheDocument();
    expect(screen.getByText(/60 M Ft|60M HUF/)).toBeInTheDocument();
    expect(await screen.findByText(/digitalizáció|digitalisation/i)).toBeInTheDocument();
    unmount();

    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail());
    renderContact();
    expect(await screen.findByText(/még nem töltött ki cégprofilt|no company profile filled in yet/i)).toBeInTheDocument();
  });

  it("lists the calls the company saved, and nothing when there are none", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail({ savedCalls: [{ id: "c1", title: "Digital Europe call", program: "DIGITAL", deadline: "2026-11-01" }, { id: "c2", title: null, program: null, deadline: null }] }));
    const { unmount } = renderContact();
    expect(await screen.findByText("Digital Europe call")).toBeInTheDocument();
    expect(screen.getByText("c2")).toBeInTheDocument();
    unmount();

    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail());
    renderContact();
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("heading", { name: /elmentett felhívások|saved calls/i })).not.toBeInTheDocument();
  });
});
