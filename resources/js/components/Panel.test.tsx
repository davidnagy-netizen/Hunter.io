import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel } from "./Panel";

describe("Panel", () => {
  it("renders children without a title or subtitle", () => {
    render(<Panel>Body content</Panel>);
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders a title and subtitle when given", () => {
    render(
      <Panel title="Fundor Score breakdown" subtitle="Five factors, weighted per the specification.">
        Body content
      </Panel>,
    );
    expect(screen.getByRole("heading", { name: "Fundor Score breakdown" })).toBeInTheDocument();
    expect(screen.getByText("Five factors, weighted per the specification.")).toBeInTheDocument();
  });
});
