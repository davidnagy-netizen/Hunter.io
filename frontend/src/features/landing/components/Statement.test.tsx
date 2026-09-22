import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { Statement } from "./Statement";

describe("Statement", () => {
  it("distills the engine's own description into a standalone line", () => {
    renderWithProviders(<Statement />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/determinisztikus.*szabályalapú.*indokolt|deterministic.*rule-based.*explained/i);
  });
});
