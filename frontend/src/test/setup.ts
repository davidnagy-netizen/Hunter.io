import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library doesn't unmount components between tests on its own.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia at all — GSAP's ScrollTrigger calls it
// unconditionally when the plugin registers (module load time, before any
// component-level guard runs), so every test touching a GSAP-using landing
// component throws without this. Individual tests that care about a specific
// media query (e.g. prefers-reduced-motion) still override it with
// `vi.stubGlobal("matchMedia", ...)`, same as before this default existed.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  })) as unknown as typeof window.matchMedia;
}
