import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { detailOf } from "@/test/apiFixtures";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { profileApi } from "@/features/profile/api/profile.api";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { answersApi } from "../api/answers.api";
import { EligibilityBadge } from "./EligibilityBadge";
import { EligibilityQuestion } from "./EligibilityQuestion";
import { FundorScoreRing } from "./FundorScoreRing";
import { ScoreBreakdown } from "./ScoreBreakdown";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn() }));
vi.mock("@/features/profile/api/profile.api", () => ({
  profileApi: { get: vi.fn(), save: vi.fn(), loadDemo: vi.fn(), history: vi.fn(), restore: vi.fn() },
}));
vi.mock("../api/answers.api", () => ({ answersApi: { save: vi.fn() } }));

beforeEach(() => {
  vi.mocked(useIsAuthenticated).mockReturnValue(true);
  vi.mocked(profileApi.get).mockResolvedValue({ profile: DEMO_PROFILE, answers: {}, saved: [], demoProfile: DEMO_PROFILE, versions: 1 });
  vi.mocked(answersApi.save).mockResolvedValue({ success: true, key: "consortium_ready", value: true });
});

describe("EligibilityBadge", () => {
  it.each([
    ["ELIGIBLE", /jogosult$|^eligible$/i],
    ["CONDITIONAL", /feltételesen|conditionally/i],
    ["INSUFFICIENT_DATA", /hiányzó adat|missing data/i],
    ["NOT_ELIGIBLE", /nem jogosult|not eligible/i],
  ] as const)("labels %s", (status, label) => {
    renderWithProviders(<EligibilityBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("uses a different tone for each verdict", () => {
    const { container } = renderWithProviders(
      <>
        <EligibilityBadge status="ELIGIBLE" />
        <EligibilityBadge status="NOT_ELIGIBLE" />
      </>,
    );
    const [eligible, blocked] = Array.from(container.querySelectorAll("span"));
    expect(eligible).toHaveClass("bg-green-bg");
    expect(blocked).toHaveClass("bg-red-bg");
  });
});

describe("FundorScoreRing", () => {
  it("shows the score with an accessible label and the server's own band wording", () => {
    renderWithProviders(<FundorScoreRing score={87} band={{ key: "strong", label: "Erős egyezés" }} />);
    expect(screen.getByRole("img", { name: /87/ })).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("Erős egyezés")).toBeInTheDocument();
  });

  it("says when a score is only an estimate", () => {
    renderWithProviders(<FundorScoreRing score={87} estimated />);
    expect(screen.getByRole("img", { name: /becsült|estimated/i })).toBeInTheDocument();
  });

  it("shows a blocked state, not a number, for a call that is never scored", () => {
    renderWithProviders(<FundorScoreRing score={null} />);
    expect(screen.getByRole("img", { name: /nem jogosult|not eligible/i })).toBeInTheDocument();
    expect(screen.queryByText("/ 100")).not.toBeInTheDocument();
  });
});

describe("ScoreBreakdown", () => {
  it("lists the five factors and expands one into the server's explanation", async () => {
    const user = userEvent.setup();
    const opp = detailOf("consortium");
    renderWithProviders(<ScoreBreakdown factors={opp.factors} />);

    const rows = screen.getAllByRole("button");
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(opp.factors[0].label)).toBeInTheDocument();

    await user.click(rows[0]);
    expect(rows[0]).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(opp.factors[0].detail)).toBeInTheDocument();
  });

  it("renders nothing for a blocked call, which has no factors", () => {
    const { container } = renderWithProviders(<ScoreBreakdown factors={detailOf("blocked").factors} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("EligibilityQuestion", () => {
  const question = () => detailOf("consortium").questions[0];

  it("asks the server's question in the active language and stores the answer company-wide", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EligibilityQuestion oppId="eu-edf-2026-da-acc-airdef-eatmi" question={question()} />);

    expect(screen.getByText(/konzorcium/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^igen, van partnerhálózatom$/i }));

    await waitFor(() =>
      expect(answersApi.save).toHaveBeenCalledWith("eu-edf-2026-da-acc-airdef-eatmi", "consortium_ready", true, "hu"),
    );
  });

  it("offers every option the server sent, including 'I don't know'", () => {
    renderWithProviders(<EligibilityQuestion oppId="x" question={question()} />);
    expect(screen.getAllByRole("button")).toHaveLength(question().opts.length);
  });
});
