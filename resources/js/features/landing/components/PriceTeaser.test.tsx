import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { PriceTeaser } from "./PriceTeaser";

describe("PriceTeaser", () => {
  it("states the price once and offers one action, into the free assessment", () => {
    renderWithProviders(<PriceTeaser />);
    expect(screen.getAllByText(/5\s?990|5,990/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: /kezdd az ingyenes felméréssel|start with the free assessment/i })).toHaveAttribute(
      "href",
      "/assess",
    );
  });
});
