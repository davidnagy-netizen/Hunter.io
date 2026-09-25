import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MatchingLoader } from "./MatchingLoader";

const STEPS = ["Normalizing profile", "Running eligibility engine", "Scoring", "Ranking"];

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MatchingLoader", () => {
  it("announces itself and lists every pipeline step", () => {
    render(<MatchingLoader title="Processing your profile" steps={STEPS} />);
    expect(screen.getByRole("status", { name: "Processing your profile" })).toBeInTheDocument();
    STEPS.forEach((s) => expect(screen.getByText(s)).toBeInTheDocument());
  });

  it("reports completion after the full animation, and not before", () => {
    const done = vi.fn();
    mockReducedMotion(false);
    render(<MatchingLoader title="t" steps={STEPS} onAnimationDone={done} />);

    act(() => void vi.advanceTimersByTime(1500));
    expect(done).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(600));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("collapses to a brief flash when the visitor prefers reduced motion", () => {
    const done = vi.fn();
    mockReducedMotion(true);
    render(<MatchingLoader title="t" steps={STEPS} onAnimationDone={done} />);

    act(() => void vi.advanceTimersByTime(500));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("ticks steps off in order", () => {
    mockReducedMotion(false);
    render(<MatchingLoader title="t" steps={STEPS} />);
    act(() => void vi.advanceTimersByTime(1900));
    expect(screen.getAllByText("✓")).toHaveLength(STEPS.length);
  });
});
