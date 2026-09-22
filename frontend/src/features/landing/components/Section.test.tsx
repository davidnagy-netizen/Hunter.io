import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Section } from "./Section";

describe("Section", () => {
  it("renders the kicker, title and subtitle when given", () => {
    render(
      <Section id="how" kicker="Kicker" title="Title" subtitle="Subtitle">
        <p>content</p>
      </Section>,
    );
    expect(screen.getByText("Kicker")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(document.getElementById("how")).toBeInTheDocument();
  });

  it("renders as a bare container — no heading, no kicker — when only children are given", () => {
    render(
      <Section>
        <p>content only</p>
      </Section>,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("content only")).toBeInTheDocument();
  });
});
