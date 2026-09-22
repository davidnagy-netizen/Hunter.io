import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { Sources } from "./Sources";

describe("Sources", () => {
  it("lists every cited source", () => {
    renderWithProviders(<Sources />);
    expect(screen.getByText(/palyazat\.gov\.hu/)).toBeInTheDocument();
    expect(screen.getByText(/kap\.gov\.hu/)).toBeInTheDocument();
  });
});
