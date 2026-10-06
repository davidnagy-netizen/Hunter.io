import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { leadsApi } from "@/features/assessment/api/leads.api";
import { useUiStore } from "@/store/uiStore";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ConsultPanel } from "./ConsultPanel";

vi.mock("@/features/assessment/api/leads.api", () => ({ leadsApi: { submit: vi.fn() } }));
vi.mock("@/features/authentication/hooks/useAuth", () => ({
  useCurrentUser: () => ({ email: "anna@ceg.hu", company: "Alfa Kft." }),
}));

beforeEach(() => useUiStore.getState().setLang("hu"));

describe("ConsultPanel", () => {
  it.each([
    ["hu", /Konzultálj velünk/, "Hívás: +36 30 508 0569"],
    ["en", /Consult with us/, "Call +36 30 508 0569"],
  ] as const)("offers a tap-to-call consultation in %s", (lang, text, call) => {
    useUiStore.getState().setLang(lang);
    render(<ConsultPanel />);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: call })).toHaveAttribute("href", "tel:+36305080569");
  });

  it("opens a contact form that sends a consented lead", async () => {
    vi.mocked(leadsApi.submit).mockResolvedValue({ success: true, id: "lead:1", updated: false });
    const user = userEvent.setup();
    renderWithProviders(<ConsultPanel />);

    await user.click(screen.getByRole("button", { name: "Kapcsolatfelvételi űrlap" }));
    expect(screen.getByLabelText("E-mail cím")).toHaveValue("anna@ceg.hu");
    await user.type(screen.getByLabelText("Üzenet (nem kötelező)"), "Visszahívást kérek.");
    await user.click(screen.getByRole("button", { name: "Küldés" }));
    expect(leadsApi.submit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Küldés" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/megkaptuk az üzenetedet/);
    expect(leadsApi.submit).toHaveBeenCalledWith(
      expect.objectContaining({ email: "anna@ceg.hu", company: "Alfa Kft.", note: "Visszahívást kérek.", consent: true }),
    );
  });
});
