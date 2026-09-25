import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { detailOf } from "@/test/apiFixtures";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { profileKeys } from "@/features/profile/api/profile.queries";
import { profileApi } from "@/features/profile/api/profile.api";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import type { GetProfileResponse } from "@/features/profile/types/profile.types";
import { opportunitiesKeys } from "@/api/opportunitiesKeys";
import { answersApi } from "../api/answers.api";
import { useEligibilityAnswers } from "./useEligibilityAnswers";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn() }));
vi.mock("@/features/profile/api/profile.api", () => ({
  profileApi: { get: vi.fn(), save: vi.fn(), loadDemo: vi.fn(), history: vi.fn(), restore: vi.fn() },
}));
vi.mock("../api/answers.api", () => ({ answersApi: { save: vi.fn() } }));

const serverProfile = (answers: Record<string, unknown>): GetProfileResponse => ({
  profile: DEMO_PROFILE,
  answers,
  saved: [],
  demoProfile: DEMO_PROFILE,
  versions: 1,
});

afterEach(() => {
  vi.mocked(answersApi.save).mockReset();
  vi.mocked(profileApi.get).mockReset();
});

function setup(initialServer?: GetProfileResponse) {
  vi.mocked(useIsAuthenticated).mockReturnValue(true);
  const queryClient = createTestQueryClient();
  if (initialServer) queryClient.setQueryData(profileKeys.detail(), initialServer);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useEligibilityAnswers(), { wrapper }) };
}

describe("useEligibilityAnswers", () => {
  it("reads the server's answers", () => {
    const { result } = setup(serverProfile({ de_minimis_ok: false }));
    expect(result.current.answers).toEqual({ de_minimis_ok: false });
  });

  it("saves through the server in the active language and updates the cache before the request returns", async () => {
    let resolveSave: (v: unknown) => void = () => {};
    vi.mocked(answersApi.save).mockReturnValue(new Promise((resolve) => (resolveSave = resolve)) as never);
    vi.mocked(profileApi.get).mockResolvedValue(serverProfile({}));
    const { result } = setup(serverProfile({}));

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.answerQuestion("ginop-dig", "de_minimis_ok", true);
    });

    await waitFor(() => expect(answersApi.save).toHaveBeenCalledWith("ginop-dig", "de_minimis_ok", true, "hu"));
    // Optimistic: the answer is already visible while the request is still in flight.
    await waitFor(() => expect(result.current.answers).toEqual({ de_minimis_ok: true }));

    await act(async () => {
      resolveSave({ success: true });
      await pending;
    });
  });

  it("puts the re-scored call from the response straight into the cache and marks every scored query stale", async () => {
    const answered = detailOf("consortium");
    vi.mocked(answersApi.save).mockResolvedValue({ success: true, key: "consortium_ready", value: true, opportunity: answered });
    vi.mocked(profileApi.get).mockResolvedValue(serverProfile({}));
    const { result, queryClient } = setup(serverProfile({}));
    queryClient.setQueryData([...opportunitiesKeys.all, "catalog", "hu", "account"], { stale: true });

    await act(async () => {
      await result.current.answerQuestion(answered.id, "consortium_ready", true);
    });

    expect(queryClient.getQueryData(opportunitiesKeys.detail(answered.id, "hu"))).toEqual(answered);
    expect(queryClient.getQueryState([...opportunitiesKeys.all, "catalog", "hu", "account"])?.isInvalidated).toBe(true);
  });

  it("rolls the cache back when the server rejects the answer", async () => {
    vi.mocked(answersApi.save).mockRejectedValue(new Error("boom"));
    vi.mocked(profileApi.get).mockResolvedValue(serverProfile({}));
    const { result } = setup(serverProfile({}));

    await act(async () => {
      await result.current.answerQuestion("ginop-dig", "de_minimis_ok", true).catch(() => {});
    });

    await waitFor(() => expect(result.current.answers).toEqual({}));
  });
});
