import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "@/store/uiStore";
import { LanguageToggle } from "./LanguageToggle";

beforeEach(() => {
  useUiStore.getState().setLang("hu");
});

describe("LanguageToggle", () => {
  it("exposes itself as a labeled group, not two unrelated buttons", () => {
    render(<LanguageToggle />);
    expect(screen.getByRole("group", { name: "Nyelv" })).toBeInTheDocument();
  });

  it("relabels the group once the language actually changes", () => {
    useUiStore.getState().setLang("en");
    render(<LanguageToggle />);
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });

  it("gives each option a full accessible name instead of just its two-letter code", () => {
    render(<LanguageToggle />);
    expect(screen.getByRole("button", { name: "Magyar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
  });

  it("marks the active language with aria-pressed and switches it on click", async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    const hu = screen.getByRole("button", { name: "Magyar" });
    const en = screen.getByRole("button", { name: "English" });
    expect(hu).toHaveAttribute("aria-pressed", "true");
    expect(en).toHaveAttribute("aria-pressed", "false");

    await user.click(en);
    expect(en).toHaveAttribute("aria-pressed", "true");
    expect(hu).toHaveAttribute("aria-pressed", "false");
    expect(useUiStore.getState().lang).toBe("en");
  });
});
