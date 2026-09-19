import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { crmApi } from "../api/crm.api";
import { makeContact, makeContactsResponse, makeDetail, makeLead } from "../testFixtures";
import { ContactPage } from "./ContactPage";
import { ContactsPage } from "./ContactsPage";

vi.mock("../api/crm.api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/crm.api")>()),
  crmApi: { board: vi.fn(), contacts: vi.fn(), leads: vi.fn(), contact: vi.fn(), updateContact: vi.fn(), addNote: vi.fn(), deleteNote: vi.fn(), addTask: vi.fn(), setTaskDone: vi.fn(), deleteTask: vi.fn(), deleteLead: vi.fn() },
}));

function Where() {
  const { pathname, search } = useLocation();
  return <output aria-label="location">{pathname + search}</output>;
}

function renderList(route = "/admin/crm/contacts") {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/admin/crm/contacts" element={<ContactsPage />} />
      </Routes>
      <Where />
    </>,
    { route },
  );
}

const lastCall = () => vi.mocked(crmApi.contacts).mock.calls.at(-1)![0];

beforeEach(() => {
  vi.mocked(crmApi.contacts).mockReset().mockResolvedValue(makeContactsResponse());
});

describe("ContactsPage — the list", () => {
  it("shows how many match and what each contact is", async () => {
    vi.mocked(crmApi.contacts).mockResolvedValue(
      makeContactsResponse({
        contacts: [
          makeContact({ subscription: { status: "active", plan: "monthly", active: true, validUntil: null, daysLeft: 12 }, lifecycle: "subscriber", monthlyValueHuf: 5990, openTasks: 2, overdueTasks: 1, daysInStage: 4 }),
          makeLead(),
        ],
        total: 2,
      }),
    );
    renderList();
    expect(await screen.findByText(/2 kapcsolat a szűrés szerint|2 contacts matching/i)).toBeInTheDocument();
    const rows = screen.getAllByRole("row").slice(1);
    const account = within(rows[0]);
    expect(account.getByText("Kata Kft.")).toBeInTheDocument();
    expect(account.getByText(/12 nap van hátra|12 days left/i)).toBeInTheDocument();
    expect(account.getByText(/5\D?990\s?(Ft|HUF)/)).toBeInTheDocument();
    expect(account.getByText(/lejárt|overdue/i)).toBeInTheDocument();
    const lead = within(rows[1]);
    expect(lead.getByText(/felmérés: 88|assessment: 88/i)).toBeInTheDocument();
  });

  it("links each row to its contact page", async () => {
    renderList();
    expect(await screen.findByRole("link", { name: /megnyitás|open/i })).toHaveAttribute("href", "/admin/crm/contact/u1");
  });

  it("says so when nothing matches", async () => {
    vi.mocked(crmApi.contacts).mockResolvedValue(makeContactsResponse({ contacts: [], total: 0 }));
    renderList("/admin/crm/contacts?q=nobody");
    expect(await screen.findByText(/nincs találat erre a szűrésre|nothing matches this filter/i)).toBeInTheDocument();
  });

  it("says why the list could not load", async () => {
    vi.mocked(crmApi.contacts).mockRejectedValue(new Error("boom"));
    renderList();
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });
});

describe("ContactsPage — filters live in the URL", () => {
  it("asks the server for exactly what the URL says", async () => {
    renderList("/admin/crm/contacts?q=kata&stage=won&lifecycle=trial&source=signup&sort=value&page=2");
    await screen.findByRole("row", { name: /kata/i }).catch(() => undefined);
    await waitFor(() => expect(crmApi.contacts).toHaveBeenCalled());
    expect(lastCall()).toEqual({ q: "kata", stage: "won", lifecycle: "trial", source: "signup", sort: "value", page: 2 });
  });

  it("choosing a stage filters, writes the URL, and returns to page 1", async () => {
    const user = userEvent.setup();
    renderList("/admin/crm/contacts?page=3");
    await screen.findByText(/1 kapcsolat|1 contacts/i);
    await user.selectOptions(screen.getByRole("combobox", { name: /minden szakasz|all stages/i }), "won");

    expect(screen.getByLabelText("location")).toHaveTextContent("/admin/crm/contacts?stage=won");
    await waitFor(() => expect(lastCall()).toMatchObject({ stage: "won", page: 1 }));
  });

  it("filters by lifecycle and source, and sorts", async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText(/1 kapcsolat|1 contacts/i);
    await user.selectOptions(screen.getByRole("combobox", { name: /minden életciklus|all lifecycles/i }), "trial");
    await user.selectOptions(screen.getByRole("combobox", { name: /minden forrás|all sources/i }), "assessment");
    await user.selectOptions(screen.getByRole("combobox", { name: /rendezés|sort/i }), "engagement");
    await waitFor(() => expect(lastCall()).toMatchObject({ lifecycle: "trial", source: "assessment", sort: "engagement", page: 1 }));
  });

  it("searches on Enter, trimming the text", async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText(/1 kapcsolat|1 contacts/i);
    await user.type(screen.getByRole("searchbox"), "  kata {enter}");
    expect(screen.getByLabelText("location")).toHaveTextContent("/admin/crm/contacts?q=kata");
    await waitFor(() => expect(lastCall()).toMatchObject({ q: "kata" }));
  });

  it("pages through a long list", async () => {
    vi.mocked(crmApi.contacts).mockResolvedValue(makeContactsResponse({ total: 60, page: 1, pageSize: 25 }));
    const user = userEvent.setup();
    renderList();
    expect(await screen.findByText("1 / 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /következő|next/i }));
    expect(screen.getByLabelText("location")).toHaveTextContent("/admin/crm/contacts?page=2");
    await waitFor(() => expect(lastCall()).toMatchObject({ page: 2 }));
  });

  it("offers no pager for a short list", async () => {
    renderList();
    await screen.findByText(/1 kapcsolat|1 contacts/i);
    expect(screen.queryByRole("navigation", { name: "pagination" })).not.toBeInTheDocument();
  });

  it("keeps the list on screen while the next filter loads", async () => {
    let release!: (v: ReturnType<typeof makeContactsResponse>) => void;
    const user = userEvent.setup();
    renderList();
    await screen.findByText("Kata Kft.");
    vi.mocked(crmApi.contacts).mockReturnValue(new Promise((resolve) => (release = resolve)));
    await user.selectOptions(screen.getByRole("combobox", { name: /minden szakasz|all stages/i }), "won");
    expect(screen.getByText("Kata Kft.")).toBeInTheDocument();
    release(makeContactsResponse({ contacts: [makeContact({ id: "u2", company: "Second Kft." })] }));
    expect(await screen.findByText("Second Kft.")).toBeInTheDocument();
  });
});

describe("ContactsPage — CSV export", () => {
  it("is a download link that follows the current filter but not the page", async () => {
    renderList("/admin/crm/contacts?stage=won&sort=value&page=2");
    const link = await screen.findByRole("link", { name: /csv/i });
    const url = new URL(link.getAttribute("href")!, "http://x");
    expect(url.pathname).toBe("/api/admin/crm/contacts");
    expect(url.searchParams.get("format")).toBe("csv");
    expect(url.searchParams.get("stage")).toBe("won");
    expect(url.searchParams.get("sort")).toBe("value");
    expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.has("pageSize")).toBe(false);
  });
});

describe("ContactsPage → ContactPage", () => {
  it("'back' returns to the filtered list you opened the contact from", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail());
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/admin/crm/contacts" element={<ContactsPage />} />
        <Route path="/admin/crm/contact/:id" element={<ContactPage />} />
      </Routes>,
      { route: "/admin/crm/contacts?stage=won&sort=value" },
    );

    await user.click(await screen.findByRole("link", { name: /megnyitás|open/i }));
    const back = await screen.findByRole("link", { name: /vissza a crm|back to the crm/i });
    expect(back).toHaveAttribute("href", "/admin/crm/contacts?stage=won&sort=value");
  });

  it("goes to the pipeline when the page was opened directly", async () => {
    vi.mocked(crmApi.contact).mockResolvedValue(makeDetail());
    renderWithProviders(
      <Routes>
        <Route path="/admin/crm/contact/:id" element={<ContactPage />} />
      </Routes>,
      { route: "/admin/crm/contact/u1" },
    );
    expect(await screen.findByRole("link", { name: /vissza a crm|back to the crm/i })).toHaveAttribute("href", "/admin/crm");
  });
});
