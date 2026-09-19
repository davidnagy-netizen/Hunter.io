import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./Reveal";

afterEach(() => vi.unstubAllGlobals());

function stubObserver() {
  let callback: IntersectionObserverCallback = () => {};
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
    },
  );
  return (isIntersecting: boolean) => act(() => callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
}

describe("Reveal", () => {
  it("shows its content immediately when the browser can't observe scrolling", () => {
    render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello").className).toContain("opacity-100");
  });

  it("starts hidden and reveals once scrolled into view", () => {
    const intersect = stubObserver();
    render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello").className).toContain("opacity-0");
    intersect(false);
    expect(screen.getByText("hello").className).toContain("opacity-0");
    intersect(true);
    expect(screen.getByText("hello").className).toContain("opacity-100");
  });

  it("shows immediately for a visitor who prefers reduced motion", () => {
    stubObserver();
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener: () => {}, removeEventListener: () => {} }));
    render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello").className).toContain("opacity-100");
  });
});
