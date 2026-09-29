import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/features/authentication/api/auth.api";
import { authKeys } from "@/features/authentication/api/auth.queries";
import type { MeResponse } from "@/features/authentication/types/auth.types";
import { loansApi } from "@/features/loans/api/loans.api";
import type { LoanCatalogResponse } from "@/features/loans/types/loans.types";
import { formatDate } from "@/lib/format";
import { gatedLoans, plusLoans } from "@/test/apiFixtures";
import meSubscriber from "@/test/fixtures/api/me.subscriber.json";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useUiStore } from "@/store/uiStore";
import { LoansPage } from "./LoansPage";

vi.mock("@/features/authentication/api/auth.api", () => ({ authApi: { me: vi.fn() } }));
vi.mock("@/features/loans/api/loans.api", () => ({ loansApi: { list: vi.fn() } }));

const subscriber = meSubscriber as unknown as MeResponse;
const anonymous = { user: null, entitlements: { tier: "anonymous" }, plans: [] } as unknown as MeResponse;
const registered = { user: { role: "user", username: "someone", company: null }, entitlements: { tier: "registered" }, plans: [] } as unknown as MeResponse;

const session = (response: MeResponse) => vi.mocked(authApi.me).mockResolvedValue(response);
const catalog = (response: LoanCatalogResponse) => vi.mocked(loansApi.list).mockResolvedValue(response);

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.getState().setLang("hu");
});

describe("LoansPage — without Fundor Plus", () => {
  it("shows what exists — the count and each category — but no product", async () => {
    session(anonymous);
    catalog(gatedLoans("hu"));
    renderWithProviders(<LoansPage />);

    expect(await screen.findByRole("heading", { name: "2 ellenőrzött hiteltermék a katalógusban" })).toBeInTheDocument();
    expect(screen.getByText(/nem a te céged jogosultságára/)).toBeInTheDocument();
    const categories = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(categories).toEqual(["Garancia / Kezességvállalás · 1", "Támogatott hitelkonstrukció · 1"]);
    expect(screen.getByText(/Fundor Plus előfizetéssel érhető el/)).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("offers a visitor with no account the way to make one, and a signed-in one nothing to click", async () => {
    session(anonymous);
    catalog(gatedLoans("hu"));
    const { unmount } = renderWithProviders(<LoansPage />);
    expect(await screen.findByRole("link", { name: "Cégfiók létrehozása" })).toHaveAttribute("href", "/register");
    unmount();

    session(registered);
    renderWithProviders(<LoansPage />);
    await screen.findByRole("heading", { name: /ellenőrzött hiteltermék/ });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("says so when no reviewed product is current, instead of an empty lock screen", async () => {
    session(anonymous);
    catalog({ ...gatedLoans("hu"), availableCount: 0, categories: [] });
    renderWithProviders(<LoansPage />);

    expect(await screen.findByText(/nincs érvényes, ellenőrzött hiteltermék/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /ellenőrzött hiteltermék a katalógusban/ })).not.toBeInTheDocument();
  });
});

describe("LoansPage — with Fundor Plus", () => {
  it("gives each product's terms and provenance, labelled by the server's type, and no score", async () => {
    useUiStore.getState().setLang("en");
    session(subscriber);
    catalog(plusLoans("en"));
    renderWithProviders(<LoansPage />);

    const cards = await screen.findAllByRole("article");
    expect(cards).toHaveLength(2);
    const guarantee = within(cards[0]);
    expect(guarantee.getByText("Guarantee Instrument")).toBeInTheDocument();
    expect(guarantee.getByRole("heading", { name: "Synthetic fixture guarantee — not a real product" })).toBeInTheDocument();
    expect(guarantee.getByText("Synthetic fixture — not a real programme")).toBeInTheDocument();
    expect(guarantee.getByText("Synthetic fixture terms. No financial offer.")).toBeInTheDocument();
    const record = plusLoans("en").loans[0];
    for (const iso of [record.effective_from_date, record.deadline, record.last_verified_date]) {
      expect(guarantee.getByText(formatDate(iso, "en"))).toBeInTheDocument();
    }
    expect(guarantee.getByText("SYNTHETIC FIXTURE — no official document")).toBeInTheDocument();
    expect(within(cards[1]).getByText("Subsidised Loan Facility")).toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
    expect(loansApi.list).toHaveBeenCalledWith("en");
  });

  it("never keeps showing a Fundor Plus response once the session is no longer Plus", async () => {
    session(subscriber);
    catalog(plusLoans("hu"));
    const { queryClient } = renderWithProviders(<LoansPage />);
    expect(await screen.findAllByRole("article")).toHaveLength(2);

    session(anonymous);
    catalog(gatedLoans("hu"));
    await queryClient.invalidateQueries({ queryKey: authKeys.me() });

    expect(await screen.findByRole("heading", { name: "2 ellenőrzött hiteltermék a katalógusban" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
