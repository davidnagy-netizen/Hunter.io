import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ComparisonSection } from "./ComparisonSection";

describe("ComparisonSection", () => {
  it("contrasts a plain grant list's result count with the personalized matches", () => {
    renderWithProviders(<ComparisonSection />);
    expect(screen.getByText("549")).toBeInTheDocument();
    expect(screen.getAllByText(/GINOP/).length).toBeGreaterThan(0);
  });

  it("gives the reason a call was ruled out, not just its name", () => {
    renderWithProviders(<ComparisonSection />);
    // TOP Plus also appears in the old-way list of 549 names, so this checks the excluded
    // reason (which only appears once) rather than the name alone.
    expect(screen.getByText(/Pest county is not an eligible location|Pest megye nem támogatható helyszín/)).toBeInTheDocument();
  });
});
