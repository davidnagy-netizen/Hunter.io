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

  it("keeps the photo panel decorative — the score preview is the hero's real content", () => {
    // The backdrop photo is `alt=""` (and `aria-hidden` on its wrapper): purely a visual, never
    // competing with the score preview card, which carries the actual product content.
    const { container } = renderWithProviders(<Hero />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) expect(img).toHaveAttribute("alt", "");
    expect(screen.getByText(/GINOP/)).toBeInTheDocument();
  });
});
