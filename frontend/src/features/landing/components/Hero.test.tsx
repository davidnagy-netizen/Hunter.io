import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("leads with the pitch and one primary action, plus a plain-text secondary path", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/ne te keresd a pályázatot|don't go looking for grants/i);

    const primary = screen.getByRole("link", { name: /megnézem, mire vagyok jogosult|see what i'm eligible for/i });
    expect(primary).toHaveAttribute("href", "/assess");

    const secondary = screen.getByRole("link", { name: /cégfiók létrehozása|create a company account/i });
    expect(secondary).toHaveAttribute("href", "/register");
    // The secondary path reads as a plain link, not a second full-weight button competing with the primary CTA.
    expect(secondary.className).not.toContain("bg-gold");
  });

  it("carries no stock photography — the score preview is the hero's visual", () => {
    // Not screen.queryByRole("img"): the score ring legitimately uses role="img" for its
    // accessible label — a real <img> element is the thing being ruled out here.
    const { container } = renderWithProviders(<Hero />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/GINOP/)).toBeInTheDocument();
  });
});
