import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CircularProgress } from "./CircularProgress";

describe("CircularProgress", () => {
  it("uses the percentage as the default accessible label", () => {
    render(<CircularProgress value={87} />);
    expect(screen.getByRole("img", { name: "87%" })).toBeInTheDocument();
  });

  it("accepts a custom accessible label", () => {
    render(<CircularProgress value={87} aria-label="Fundor Score 87 out of 100" />);
    expect(screen.getByRole("img", { name: "Fundor Score 87 out of 100" })).toBeInTheDocument();
  });

  it("clamps out-of-range values into 0–100", () => {
    render(<CircularProgress value={150} />);
    expect(screen.getByRole("img", { name: "100%" })).toBeInTheDocument();
  });

  it("renders centered content", () => {
    render(
      <CircularProgress value={87}>
        <span>87</span>
      </CircularProgress>,
    );
    expect(screen.getByText("87")).toBeInTheDocument();
  });

  it("draws a full ring at 0% and no visible arc gap at 100%", () => {
    const { container: emptyContainer } = render(<CircularProgress value={0} size={100} strokeWidth={10} />);
    const { container: fullContainer } = render(<CircularProgress value={100} size={100} strokeWidth={10} />);

    const emptyProgressCircle = emptyContainer.querySelectorAll("circle")[1];
    const fullProgressCircle = fullContainer.querySelectorAll("circle")[1];

    const circumference = 2 * Math.PI * ((100 - 10) / 2);
    expect(Number(emptyProgressCircle.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference, 5);
    expect(Number(fullProgressCircle.getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 5);
  });
});
