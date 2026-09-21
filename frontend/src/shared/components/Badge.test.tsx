import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Eligible</Badge>);
    expect(screen.getByText("Eligible")).toBeInTheDocument();
  });

  it("defaults to the slate tone", () => {
    render(<Badge>Missing data</Badge>);
    expect(screen.getByText("Missing data")).toHaveClass("bg-slate-bg", "text-slate");
  });

  it("applies the requested tone", () => {
    render(<Badge tone="red">Not eligible</Badge>);
    expect(screen.getByText("Not eligible")).toHaveClass("bg-red-bg", "text-red");
  });
});
