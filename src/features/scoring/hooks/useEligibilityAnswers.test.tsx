import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { profileKeys } from "@/features/profile/api/profile.queries";
import { profileApi } from "@/features/profile/api/profile.api";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import type { GetProfileResponse } from "@/features/profile/types/profile.types";
import { answersApi } from "../api/answers.api";
import { useLocalAnswersStore } from "../store/localAnswersStore";
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
  useLocalAnswersStore.getState().clear();
  vi.mocked(answersApi.save).mockReset();
  vi.mocked(profileApi.get).mockReset();
});

function setup(authenticated: boolean, initialServer?: GetProfileResponse) {
  vi.mocked(useIsAuthenticated).mockReturnValue(authenticated);
  const queryClient = createTestQueryClient();
  if (initialServer) queryClient.setQueryData(profileKeys.detail(), initialServer);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useEligibilityAnswers(), { wrapper }) };
}

describe("useEligibilityAnswers", () => {
  it("anonymous: stores the answer locally and never calls the server", async () => {
    const { result } = setup(false);

    await act(() => result.current.answerQuestion("ginop-dig", "de_minimis_ok", true));

    expect(answersApi.save).not.toHaveBeenCalled();
    expect(result.current.answers).toEqual({ de_minimis_ok: true });
  });

  it("anonymous: answering null removes the answer", async () => {
    const { result } = setup(false);
    await act(() => result.current.answerQuestion("x", "de_minimis_ok", true));
    await act(() => result.current.answerQuestion("x", "de_minimis_ok", null));
    expect(result.current.answers).toEqual({});
  });

  it("signed in: reads the server's answers, not the browser's", () => {
    useLocalAnswersStore.getState().setAnswer("consortium_ready", true);
    const { result } = setup(true, serverProfile({ de_minimis_ok: false }));
    expect(result.current.answers).toEqual({ de_minimis_ok: false });
  });

  it("signed in: saves through the server and updates the cache before the request returns", async () => {
    let resolveSave: (v: unknown) => void = () => {};
    vi.mocked(answersApi.save).mockReturnValue(new Promise((resolve) => (resolveSave = resolve)) as never);
    vi.mocked(profileApi.get).mockResolvedValue(serverProfile({}));
    const { result } = setup(true, serverProfile({}));

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.answerQuestion("ginop-dig", "de_minimis_ok", true);
    });

    await waitFor(() => expect(answersApi.save).toHaveBeenCalledWith("ginop-dig", "de_minimis_ok", true));
    // Optimistic: the answer is already visible while the request is still in flight.
    await waitFor(() => expect(result.current.answers).toEqual({ de_minimis_ok: true }));
    expect(useLocalAnswersStore.getState().answers).toEqual({});

    await act(async () => {
      resolveSave({ success: true });
      await pending;
    });
  });

  it("signed in: rolls the cache back when the server rejects the answer", async () => {
    vi.mocked(answersApi.save).mockRejectedValue(new Error("boom"));
    vi.mocked(profileApi.get).mockResolvedValue(serverProfile({}));
    const { result } = setup(true, serverProfile({}));

    await act(async () => {
      await result.current.answerQuestion("ginop-dig", "de_minimis_ok", true).catch(() => {});
    });

    await waitFor(() => expect(result.current.answers).toEqual({}));
  });
});
