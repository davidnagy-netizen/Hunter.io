import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { OPPS } from "@server-src/data/mockGrants.js";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { metaApi } from "@/shared/api/meta.api";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { useLocalProfileStore } from "@/features/profile/store/localProfileStore";
import { useLocalAnswersStore } from "../store/localAnswersStore";
import { useEligibilityAnswers } from "./useEligibilityAnswers";
import { useFundorScore, useRankedOpportunities } from "./useScoring";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn() }));
vi.mock("@/shared/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));

let queryClient = createTestQueryClient();
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const opp = (id: string) => OPPS.find((o) => o.id === id)!;

beforeEach(() => {
  queryClient = createTestQueryClient();
  vi.mocked(useIsAuthenticated).mockReturnValue(false);
  vi.mocked(metaApi.get).mockResolvedValue({ today: "2026-09-07" } as never);
  useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
});
afterEach(() => {
  useLocalProfileStore.getState().clear();
  useLocalAnswersStore.getState().clear();
});

describe("useFundorScore", () => {
  it("scores an opportunity for the current company", async () => {
    const { result } = renderHook(() => useFundorScore(opp("szechenyi-tech")), { wrapper });
    await waitFor(() => expect(result.current?.score).toBe(95));
  });

  it("is null when there is no company profile yet", () => {
    useLocalProfileStore.getState().clear();
    const { result } = renderHook(() => useFundorScore(opp("szechenyi-tech")), { wrapper });
    expect(result.current).toBeNull();
  });

  it("recalculates immediately when an eligibility answer changes (the ask-and-recalculate loop)", async () => {
    const { result } = renderHook(
      () => ({ score: useFundorScore(opp("ginop-dig")), answers: useEligibilityAnswers() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.score?.score).toBe(87));
    expect(result.current.score?.estimated).toBe(true);

    await act(() => result.current.answers.answerQuestion("ginop-dig", "de_minimis_ok", true));
    await waitFor(() => expect(result.current.score?.score).toBe(89));
    expect(result.current.score?.estimated).toBe(false);

    await act(() => result.current.answers.answerQuestion("ginop-dig", "de_minimis_ok", false));
    await waitFor(() => expect(result.current.score?.blocked).toBe(true));
  });
});

describe("useRankedOpportunities", () => {
  it("ranks eligible calls first, highest score first", async () => {
    const { result } = renderHook(() => useRankedOpportunities(OPPS), { wrapper });
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    const [top] = result.current;
    expect(top.res.blocked).toBe(false);
    expect(top.res.score).toBe(95);
  });
});
