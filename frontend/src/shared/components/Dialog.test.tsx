import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("is a labelled modal dialog", () => {
    render(<Dialog title="Why was it lost?" onClose={() => {}}><textarea aria-label="reason" /></Dialog>);
    const dialog = screen.getByRole("dialog", { name: "Why was it lost?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("moves focus to its first field on open", () => {
    render(<Dialog title="t" onClose={() => {}}><textarea aria-label="reason" /></Dialog>);
    expect(screen.getByLabelText("reason")).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<Dialog title="t" onClose={onClose}><button>ok</button></Dialog>);
    await userEvent.setup().keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a click on the backdrop, but not on a click inside the panel", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Dialog title="t" onClose={onClose}><button>ok</button></Dialog>);

    await user.click(screen.getByRole("button", { name: "ok" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hands focus back to what had it before", async () => {
    function Host() {
      return <Dialog title="t" onClose={() => {}}><button>ok</button></Dialog>;
    }
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<Host />);
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });
});
