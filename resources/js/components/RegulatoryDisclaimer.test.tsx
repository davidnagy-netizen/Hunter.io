import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import i18n from "i18next";
import "@/i18n/i18n";
import { RegulatoryDisclaimer } from "./RegulatoryDisclaimer";

it("can be closed with its X button", async () => {
  await i18n.changeLanguage("en");
  render(<RegulatoryDisclaimer />);
  await userEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

it("shows the credit disclaimer without authentication in both languages", async () => {
  await i18n.changeLanguage("en");
  const view = render(<RegulatoryDisclaimer />);
  expect(screen.getByRole("complementary")).toHaveTextContent("not credit recommendations");
  await i18n.changeLanguage("hu");
  view.rerender(<RegulatoryDisclaimer />);
  expect(screen.getByRole("complementary")).toHaveTextContent("nem hitelajánlások");
});
