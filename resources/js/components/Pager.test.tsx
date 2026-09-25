import "@/i18n/i18n";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pager } from "./Pager";

describe("Pager", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<Pager page={1} pages={1} onPage={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows where you are and steps forward and back", async () => {
    const onPage = vi.fn();
    const user = userEvent.setup();
    render(<Pager page={2} pages={5} onPage={onPage} />);

    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /következő|next/i }));
    expect(onPage).toHaveBeenLastCalledWith(3);
    await user.click(screen.getByRole("button", { name: /előző|previous/i }));
    expect(onPage).toHaveBeenLastCalledWith(1);
  });

  it("can't go past either end", () => {
    const { rerender } = render(<Pager page={1} pages={3} onPage={() => {}} />);
    expect(screen.getByRole("button", { name: /előző|previous/i })).toBeDisabled();
    rerender(<Pager page={3} pages={3} onPage={() => {}} />);
    expect(screen.getByRole("button", { name: /következő|next/i })).toBeDisabled();
  });
});
