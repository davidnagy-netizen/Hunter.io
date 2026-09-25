import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { profileApi } from "@/features/profile/api/profile.api";
import { profileKeys } from "@/features/profile/api/profile.queries";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { opportunitiesApi } from "../api/opportunities.api";
import { useLocalSavedStore } from "../store/localSavedStore";
import { useSaved } from "./useSaved";

vi.mock("@/features/authentication/hooks/useAuth", () => ({ useIsAuthenticated: vi.fn() }));
vi.mock("@/features/profile/api/profile.api", () => ({ profileApi: { get: vi.fn(), save: vi.fn(), loadDemo: vi.fn(), history: vi.fn(), restore: vi.fn() } }));
vi.mock("../api/opportunities.api", () => ({ opportunitiesApi: { catalog: vi.fn(), catalogFor: vi.fn(), toggleSaved: vi.fn() } }));

afterEach(() => {
  useLocalSavedStore.getState().clear();
  vi.clearAllMocks();
});

function setup(authenticated: boolean, serverSaved: string[] = []) {
  vi.mocked(useIsAuthenticated).mockReturnValue(authenticated);
  const server = { profile: DEMO_PROFILE, answers: {}, saved: serverSaved, demoProfile: DEMO_PROFILE, versions: 1 };
  vi.mocked(profileApi.get).mockResolvedValue(server);
  const client = createTestQueryClient();
  client.setQueryData(profileKeys.detail(), server);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useSaved(), { wrapper });
}

describe("useSaved", () => {
  it("anonymous: toggles in the browser only", async () => {
    const { result } = setup(false);
    await act(() => result.current.toggle("a"));
    expect(result.current.ids).toEqual(["a"]);
    expect(result.current.isSaved("a")).toBe(true);
    expect(opportunitiesApi.toggleSaved).not.toHaveBeenCalled();
    await act(() => result.current.toggle("a"));
    expect(result.current.ids).toEqual([]);
  });

  it("signed in: reads the server's list and toggles through the server, optimistically", async () => {
    let finish: (v: unknown) => void = () => {};
    vi.mocked(opportunitiesApi.toggleSaved).mockReturnValue(new Promise((r) => (finish = r)) as never);
    const { result } = setup(true, ["x"]);
    expect(result.current.ids).toEqual(["x"]);

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.toggle("y");
    });
    await waitFor(() => expect(result.current.ids).toEqual(["x", "y"]));
    expect(opportunitiesApi.toggleSaved).toHaveBeenCalledWith("y");
    expect(useLocalSavedStore.getState().ids).toEqual([]);

    await act(async () => {
      finish({ success: true });
      await pending;
    });
  });
});
