import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "@/store/uiStore";
import { ConsultPanel } from "./ConsultPanel";

beforeEach(() => useUiStore.getState().setLang("hu"));

describe("ConsultPanel", () => {
  it.each([
    ["hu", /Konzultálj velünk/, "Hívás: +36 30 508 0569"],
    ["en", /Consult with us/, "Call +36 30 508 0569"],
  ] as const)("offers a tap-to-call consultation in %s", (lang, text, call) => {
    useUiStore.getState().setLang(lang);
    render(<ConsultPanel />);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: call })).toHaveAttribute("href", "tel:+36305080569");
  });
});
