import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/shared/hooks/useAuth";
import { profileApi } from "../api/profile.api";
import { useLocalProfileStore } from "../store/localProfileStore";
import { DEMO_PROFILE } from "../data/demoProfile";
import { useCompanyProfile } from "./useCompanyProfile";
import type { ReactNode } from "react";

vi.mock("@/shared/hooks/useAuth", () => ({
  useIsAuthenticated: vi.fn(),
}));

vi.mock("../api/profile.api", () => ({
  profileApi: {
    get: vi.fn(),
    save: vi.fn(),
    loadDemo: vi.fn(),
    history: vi.fn(),
    restore: vi.fn(),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
  useLocalProfileStore.getState().clear();
  vi.mocked(profileApi.save).mockReset();
  vi.mocked(profileApi.loadDemo).mockReset();
  vi.mocked(profileApi.get).mockReset();
});

describe("useCompanyProfile — the profile-sync bug fix", () => {
  it("as an anonymous visitor, saveProfile writes only to the local store, never the server", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    const { result } = renderHook(() => useCompanyProfile(), { wrapper });

    await result.current.saveProfile(DEMO_PROFILE);

    expect(profileApi.save).not.toHaveBeenCalled();
    expect(useLocalProfileStore.getState().profile).toEqual(DEMO_PROFILE);
  });

  it("as a signed-in account, saveProfile calls the server on every save — not just the first", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(profileApi.get).mockResolvedValue({
      profile: null,
      answers: {},
      saved: [],
      demoProfile: DEMO_PROFILE,
      versions: 0,
    });
    vi.mocked(profileApi.save).mockResolvedValue({ success: true, profile: DEMO_PROFILE, version: 1, changed: [] });
    const { result } = renderHook(() => useCompanyProfile(), { wrapper });

    // First save.
    await result.current.saveProfile(DEMO_PROFILE);
    expect(profileApi.save).toHaveBeenCalledTimes(1);
    expect(profileApi.save).toHaveBeenCalledWith(DEMO_PROFILE);

    // A second, later save — this is exactly the case the legacy
    // `syncProfileToServer()` no-op silently dropped.
    const edited = { ...DEMO_PROFILE, employees: 45 };
    vi.mocked(profileApi.save).mockResolvedValue({ success: true, profile: edited, version: 2, changed: [] });
    await result.current.saveProfile(edited);
    expect(profileApi.save).toHaveBeenCalledTimes(2);
    expect(profileApi.save).toHaveBeenLastCalledWith(edited);

    expect(useLocalProfileStore.getState().profile).toBeNull();
  });

  it("as an anonymous visitor, loadDemo sets the demo profile locally without calling the server", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(false);
    const { result } = renderHook(() => useCompanyProfile(), { wrapper });

    const returned = await result.current.loadDemo();

    expect(profileApi.loadDemo).not.toHaveBeenCalled();
    expect(returned).toEqual(DEMO_PROFILE);
    expect(useLocalProfileStore.getState().profile).toEqual(DEMO_PROFILE);
  });

  it("as a signed-in account, loadDemo calls the server's load-demo endpoint", async () => {
    vi.mocked(useIsAuthenticated).mockReturnValue(true);
    vi.mocked(profileApi.get).mockResolvedValue({
      profile: null,
      answers: {},
      saved: [],
      demoProfile: DEMO_PROFILE,
      versions: 0,
    });
    vi.mocked(profileApi.loadDemo).mockResolvedValue({ success: true, profile: DEMO_PROFILE });
    const { result } = renderHook(() => useCompanyProfile(), { wrapper });

    await result.current.loadDemo();

    await waitFor(() => expect(profileApi.loadDemo).toHaveBeenCalledTimes(1));
    expect(useLocalProfileStore.getState().profile).toBeNull();
  });
});
