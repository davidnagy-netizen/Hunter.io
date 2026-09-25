import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useRevealed } from "./useRevealed";

afterEach(() => vi.unstubAllGlobals());

it("preserves observer options, reveals once, and cleans up", () => {
  let callback: IntersectionObserverCallback = () => {};
  const disconnect = vi.fn();
  const observe = vi.fn();
  const options: IntersectionObserverInit[] = [];
  vi.stubGlobal("IntersectionObserver", class {
    constructor(cb: IntersectionObserverCallback, init: IntersectionObserverInit) {
      callback = cb;
      options.push(init);
    }
    observe = observe;
    disconnect = disconnect;
  });
  const { result, rerender, unmount } = renderHook(({ threshold }) => useRevealed<HTMLDivElement>({ threshold, rootMargin: "0px 0px -8% 0px" }), { initialProps: { threshold: 0.12 } });
  result.current.ref.current = document.createElement("div");
  rerender({ threshold: 0.4 });
  expect(options).toEqual([{ threshold: 0.4, rootMargin: "0px 0px -8% 0px" }]);
  expect(observe).toHaveBeenCalledWith(result.current.ref.current);
  act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(result.current.revealed).toBe(true);
  expect(disconnect).toHaveBeenCalled();
  unmount();
});

it("disconnects when unmounted before intersection", () => {
  const disconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect = disconnect;
  });
  const { result, rerender, unmount } = renderHook(({ threshold }) => useRevealed<HTMLDivElement>({ threshold }), { initialProps: { threshold: 0.12 } });
  result.current.ref.current = document.createElement("div");
  rerender({ threshold: 0.4 });
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});
