import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIsSubscriber } from "@/shared/hooks/useAuth";
import { PlusNavBadge } from "./PlusNavBadge";

vi.mock("@/shared/hooks/useAuth", () => ({ useIsSubscriber: vi.fn() }));

beforeEach(() => vi.mocked(useIsSubscriber).mockReturnValue(false));

describe("PlusNavBadge", () => {
  it("tags a subscriber's link PLUS", () => {
    vi.mocked(useIsSubscriber).mockReturnValue(true);
    render(<PlusNavBadge />);
    expect(screen.getByText("PLUS")).toBeInTheDocument();
  });

  it("locks it for everyone else", () => {
    const { container } = render(<PlusNavBadge />);
    expect(screen.queryByText("PLUS")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
