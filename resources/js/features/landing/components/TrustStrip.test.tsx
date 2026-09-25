import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { TrustStrip } from "./TrustStrip";

describe("TrustStrip", () => {
  it("names the official sources", () => {
    // Two matches, not one: the marquee track holds two back-to-back copies of the content so
    // the scroll loop is seamless (see TrustStrip's own comment on this).
    renderWithProviders(<TrustStrip />);
    expect(screen.getAllByText(/palyazat\.gov\.hu/).length).toBe(2);
  });
});
