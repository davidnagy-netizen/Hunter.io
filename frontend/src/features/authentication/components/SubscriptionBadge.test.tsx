import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubscriptionBadge } from "./SubscriptionBadge";

describe("SubscriptionBadge", () => {
  it("shows the days left on a trial", () => {
    render(<SubscriptionBadge subscription={{ status: "trial", active: true, daysLeft: 3 }} />);
    expect(screen.getByText(/próbaidő · 3 nap|trial · 3 days/i)).toBeInTheDocument();
  });

  it("shows an active subscription with its days left", () => {
    render(<SubscriptionBadge subscription={{ status: "active", active: true, daysLeft: 28 }} />);
    expect(screen.getByText(/aktív előfizetés · 28 nap|active · 28 days/i)).toBeInTheDocument();
  });

  it("omits the countdown when the subscription has no end date", () => {
    render(<SubscriptionBadge subscription={{ status: "active", active: true, daysLeft: null }} />);
    expect(screen.getByText(/^(aktív előfizetés|active)$/i)).toBeInTheDocument();
  });

  it("says so when there is no active subscription", () => {
    render(<SubscriptionBadge subscription={{ status: "none", active: false, daysLeft: null }} />);
    expect(screen.getByText(/nincs előfizetés|no subscription/i)).toBeInTheDocument();
  });
});
