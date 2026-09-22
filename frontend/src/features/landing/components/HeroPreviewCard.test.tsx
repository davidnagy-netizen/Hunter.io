import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { HeroPreviewCard } from "./HeroPreviewCard";

describe("HeroPreviewCard", () => {
  it("shows a worked, representative match — program, score, checks and the key figures", async () => {
    renderWithProviders(<HeroPreviewCard />);
    expect(screen.getByText(/GINOP/)).toBeInTheDocument();
    // The score ring draws in on mount rather than appearing static — wait for it to land.
    expect(await screen.findByText("87")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /87/ })).toBeInTheDocument();
    expect(screen.getByText(/5–50\s?M/)).toBeInTheDocument();
  });
});
