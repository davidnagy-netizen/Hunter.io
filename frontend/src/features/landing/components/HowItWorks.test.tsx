import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { HowItWorks } from "./HowItWorks";

describe("HowItWorks", () => {
  it("lists the three steps under its own #how anchor", () => {
    renderWithProviders(<HowItWorks />);
    expect(document.getElementById("how")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/három lépés|three steps/i);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
