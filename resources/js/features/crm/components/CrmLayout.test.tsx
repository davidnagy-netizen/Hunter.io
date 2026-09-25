import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { crmApi } from "../api/crm.api";
import { makeBoard } from "../testFixtures";
import { CrmLayout } from "./CrmLayout";

vi.mock("../api/crm.api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/crm.api")>()),
  crmApi: { board: vi.fn() },
}));

function renderLayout(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/crm" element={<CrmLayout />}>
        <Route index element={<p>pipeline body</p>} />
        <Route path="leads" element={<p>leads body</p>} />
      </Route>
    </Routes>,
    { route },
  );
}

beforeEach(() => {
  vi.mocked(crmApi.board).mockReset().mockResolvedValue(makeBoard());
});

describe("CrmLayout", () => {
  it("has a tab for each part of the CRM, each a real link", async () => {
    renderLayout("/admin/crm");
    const nav = await screen.findByRole("navigation");
    const hrefs = [...nav.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/admin/crm", "/admin/crm/contacts", "/admin/crm/leads", "/admin/crm/insights"]);
  });

  it("counts open deals, contacts and leads from the server's own metrics", async () => {
    renderLayout("/admin/crm");
    const nav = await screen.findByRole("navigation");
    expect(await screen.findByText("2", { selector: "span" })).toBeInTheDocument();
    expect(nav).toHaveTextContent(/2/);
    expect(nav).toHaveTextContent(/3/);
    expect(nav).toHaveTextContent(/1/);
  });

  it("marks the current tab and renders its page", async () => {
    renderLayout("/admin/crm/leads");
    expect(await screen.findByText("leads body")).toBeInTheDocument();
    const current = (await screen.findAllByRole("link")).find((a) => a.getAttribute("href") === "/admin/crm/leads")!;
    expect(current).toHaveAttribute("aria-current", "page");
  });
});
