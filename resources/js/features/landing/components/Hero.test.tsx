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

  it("mounts a 3D scene alongside the pitch — decorative, never the only content", () => {
    // The coin scene is a <canvas>, so it carries no text of its own for assistive tech; the
    // heading/CTA assertions above are what prove the hero's actual content still renders.
    const { container } = renderWithProviders(<Hero />);
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });
});
