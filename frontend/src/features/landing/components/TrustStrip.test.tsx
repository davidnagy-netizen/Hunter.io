import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { TrustStrip } from "./TrustStrip";

describe("TrustStrip", () => {
  it("names the official sources", () => {
    renderWithProviders(<TrustStrip />);
    expect(screen.getByText(/palyazat\.gov\.hu/)).toBeInTheDocument();
  });
});
