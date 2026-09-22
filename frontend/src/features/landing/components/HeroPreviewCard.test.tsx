import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { HeroPreviewCard } from "./HeroPreviewCard";

describe("HeroPreviewCard", () => {
  it("shows a worked, representative match — program, score, checks and the key figures", () => {
    renderWithProviders(<HeroPreviewCard />);
    expect(screen.getByText(/GINOP/)).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /87/ })).toBeInTheDocument();
    expect(screen.getByText(/5–50\s?M/)).toBeInTheDocument();
  });
});
