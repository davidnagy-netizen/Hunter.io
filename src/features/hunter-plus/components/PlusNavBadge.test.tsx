import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import { PlusNavBadge } from "./PlusNavBadge";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsSubscriber: vi.fn() }));

beforeEach(() => vi.mocked(useIsSubscriber).mockReturnValue(false));

describe("PlusNavBadge", () => {
  it("tags a subscriber's link PRO", () => {
    vi.mocked(useIsSubscriber).mockReturnValue(true);
    render(<PlusNavBadge />);
    expect(screen.getByText("PRO")).toBeInTheDocument();
  });

  it("locks it for everyone else", () => {
    const { container } = render(<PlusNavBadge />);
    expect(screen.queryByText("PRO")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
