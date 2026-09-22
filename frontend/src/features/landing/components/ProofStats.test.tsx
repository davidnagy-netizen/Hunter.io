import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ProofStats } from "./ProofStats";

afterEach(() => vi.unstubAllGlobals());

function stubObserver() {
  const callbacks: IntersectionObserverCallback[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        callbacks.push(cb);
      }
      observe() {}
      disconnect() {}
    },
  );
  return (isIntersecting: boolean) =>
    act(() => callbacks.forEach((cb) => cb([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)));
}

describe("ProofStats", () => {
  // jsdom's requestAnimationFrame doesn't run at a realistic ~60fps cadence, so the 1300ms
  // animation takes considerably longer than that in wall-clock test time. Generous timeouts
  // here, not fine-tuned ones — the point of these tests is the gating (0 until revealed, then
  // moves), not exact animation timing, which the reduced-motion test covers precisely instead.
  const GENEROUS = { timeout: 5000 };

  it("starts counting up right away when the browser can't observe scrolling", async () => {
    renderWithProviders(<ProofStats />);
    await waitFor(() => expect(screen.queryByText("0")).not.toBeInTheDocument(), GENEROUS);
  });

  it("starts at 0 and only counts up once scrolled into view", async () => {
    const intersect = stubObserver();
    renderWithProviders(<ProofStats />);
    expect(screen.getAllByText("0")).toHaveLength(3);
    expect(screen.queryByText("549")).not.toBeInTheDocument();

    intersect(true);
    await waitFor(() => expect(screen.queryByText("0")).not.toBeInTheDocument(), GENEROUS);
  });

  it("shows the final numbers immediately for a visitor who prefers reduced motion", () => {
    stubObserver();
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener: () => {}, removeEventListener: () => {} }));
    renderWithProviders(<ProofStats />);
    expect(screen.getByText("549")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
  });
});
