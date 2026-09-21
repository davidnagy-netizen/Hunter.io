import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { authKeys } from "../api/auth.queries";
import type { MeResponse, AuthUser, Entitlements } from "../types/auth.types";
import { useCurrentUser, useIsAdmin, useIsAuthenticated, useIsSubscriber } from "./useAuth";

function meResponse(overrides: Partial<MeResponse>): MeResponse {
  return {
    user: null,
    entitlements: { tier: "anonymous", maxResults: 0, explanations: false, calculator: false, applyLinks: false, exportData: false, admin: false },
    plans: [],
    adminSeed: { usingDefaultPassword: true, username: "admin" },
    ...overrides,
  };
}

function seed(response: MeResponse) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.me(), response);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return wrapper;
}

const admin = { role: "admin" } as AuthUser;
const registeredUser = { role: "user" } as AuthUser;
const subscriberEntitlements = { tier: "subscriber" } as Entitlements;
const registeredEntitlements = { tier: "registered" } as Entitlements;

describe("useAuth derived hooks", () => {
  it("reports no user, not admin, not subscriber, not authenticated when logged out", () => {
    const wrapper = seed(meResponse({}));
    expect(renderHook(() => useCurrentUser(), { wrapper }).result.current).toBeNull();
    expect(renderHook(() => useIsAdmin(), { wrapper }).result.current).toBe(false);
    expect(renderHook(() => useIsSubscriber(), { wrapper }).result.current).toBe(false);
    expect(renderHook(() => useIsAuthenticated(), { wrapper }).result.current).toBe(false);
  });

  it("reports admin as both admin and subscriber-equivalent", () => {
    const wrapper = seed(meResponse({ user: admin, entitlements: { tier: "admin" } as Entitlements }));
    expect(renderHook(() => useIsAdmin(), { wrapper }).result.current).toBe(true);
    expect(renderHook(() => useIsSubscriber(), { wrapper }).result.current).toBe(true);
  });

  it("reports a registered-but-unsubscribed user as neither admin nor subscriber", () => {
    const wrapper = seed(meResponse({ user: registeredUser, entitlements: registeredEntitlements }));
    expect(renderHook(() => useIsAuthenticated(), { wrapper }).result.current).toBe(true);
    expect(renderHook(() => useIsAdmin(), { wrapper }).result.current).toBe(false);
    expect(renderHook(() => useIsSubscriber(), { wrapper }).result.current).toBe(false);
  });

  it("reports a paying subscriber correctly", () => {
    const wrapper = seed(meResponse({ user: registeredUser, entitlements: subscriberEntitlements }));
    expect(renderHook(() => useIsSubscriber(), { wrapper }).result.current).toBe(true);
    expect(renderHook(() => useIsAdmin(), { wrapper }).result.current).toBe(false);
  });
});
