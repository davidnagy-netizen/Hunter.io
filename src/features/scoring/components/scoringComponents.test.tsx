import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPPS } from "@server-src/data/mockGrants.js";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { hunterScore } from "../domain/engine";
import { useLocalAnswersStore } from "../store/localAnswersStore";
import { EligibilityBadge } from "./EligibilityBadge";
import { EligibilityQuestion } from "./EligibilityQuestion";
import { HunterScoreRing } from "./HunterScoreRing";
import { ScoreBreakdown } from "./ScoreBreakdown";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn() }));

const opp = (id: string) => OPPS.find((o) => o.id === id)!;

beforeEach(() => {
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  useLocalAnswersStore.getState().clear();
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

describe("HunterScoreRing", () => {
  it("shows the score with an accessible label", () => {
    renderWithProviders(<HunterScoreRing score={87} />);
    expect(screen.getByRole("img", { name: /87/ })).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
  });

  it("says when a score is only an estimate", () => {
    renderWithProviders(<HunterScoreRing score={87} estimated />);
    expect(screen.getByRole("img", { name: /becsült|estimated/i })).toBeInTheDocument();
  });

  it("shows a blocked state, not a number, for a call that is never scored", () => {
    renderWithProviders(<HunterScoreRing score={null} />);
    expect(screen.getByRole("img", { name: /nem jogosult|not eligible/i })).toBeInTheDocument();
    expect(screen.queryByText("/ 100")).not.toBeInTheDocument();
  });
});

describe("ScoreBreakdown", () => {
  it("lists the five factors and expands one into its concrete reason", async () => {
    const user = userEvent.setup();
    const o = opp("szechenyi-tech");
    renderWithProviders(<ScoreBreakdown opp={o} profile={DEMO_PROFILE} result={hunterScore(o, DEMO_PROFILE)} />);

    const rows = screen.getAllByRole("button");
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveAttribute("aria-expanded", "false");

    await user.click(rows[0]);
    expect(rows[0]).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/kötelező feltétel|hard criteria/i)).toBeInTheDocument();
  });

  it("renders nothing for a blocked call", () => {
    const o = opp("top-site");
    const { container } = renderWithProviders(
      <ScoreBreakdown opp={o} profile={DEMO_PROFILE} result={hunterScore(o, DEMO_PROFILE)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("EligibilityQuestion", () => {
  const deMinimis = () => opp("ginop-dig").hard.find((r) => r.field === "de_minimis_ok")!;

  it("asks the rule's question and stores the answer company-wide", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EligibilityQuestion oppId="ginop-dig" rule={deMinimis()} />);

    expect(screen.getByText(/de minimis/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^igen$|^yes$/i }));

    await waitFor(() => expect(useLocalAnswersStore.getState().answers).toEqual({ de_minimis_ok: true }));
    expect(screen.getByRole("button", { name: /^igen$|^yes$/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders nothing for a rule that has no quiz", () => {
    const rule = opp("ginop-dig").hard.find((r) => !r.quiz)!;
    const { container } = renderWithProviders(<EligibilityQuestion oppId="ginop-dig" rule={rule} />);
    expect(container).toBeEmptyDOMElement();
  });
});
