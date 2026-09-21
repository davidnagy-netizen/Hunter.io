import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library doesn't unmount components between tests on its own.
afterEach(() => {
  cleanup();
});
