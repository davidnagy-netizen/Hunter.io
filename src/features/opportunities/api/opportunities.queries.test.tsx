import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { authApi } from "@/features/authentication/api/auth.api";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { useLocalProfileStore } from "@/features/profile/store/localProfileStore";
import { profileApi } from "@/features/profile/api/profile.api";
import { opportunitiesApi } from "./opportunities.api";
import { useCatalog } from "./opportunities.queries";

vi.mock("@/features/authentication/api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));
vi.mock("@/features/profile/api/profile.api", () => ({ profileApi: { get: vi.fn(), save: vi.fn(), loadDemo: vi.fn(), history: vi.fn(), restore: vi.fn() } }));
vi.mock("@/features/scoring/api/answers.api", () => ({ answersApi: { save: vi.fn() } }));
vi.mock("./opportunities.api", () => ({ opportunitiesApi: { catalog: vi.fn(), catalogFor: vi.fn(), toggleSaved: vi.fn() } }));

const ME = (tier: string, user: unknown) => ({ user, entitlements: { tier }, plans: [], adminSeed: {} }) as never;
let client = createTestQueryClient();
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

beforeEach(() => {
  client = createTestQueryClient();
  vi.mocked(opportunitiesApi.catalog).mockResolvedValue({ gated: false, opportunities: [] } as never);
  vi.mocked(opportunitiesApi.catalogFor).mockResolvedValue({ gated: true, teasers: [] } as never);
});
afterEach(() => {
  useLocalProfileStore.getState().clear();
  vi.clearAllMocks();
});

describe("useCatalog", () => {
  it("an anonymous visitor with a profile sends it in the request body", async () => {
    vi.mocked(authApi.me).mockResolvedValue(ME("anonymous", null));
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    const { result } = renderHook(() => useCatalog(), { wrapper });

    await waitFor(() => expect(result.current.catalog).toBeDefined());
    expect(opportunitiesApi.catalogFor).toHaveBeenCalledWith(DEMO_PROFILE, {});
    expect(opportunitiesApi.catalog).not.toHaveBeenCalled();
  });

  it("an anonymous visitor without a profile makes no request (the server would score its demo company)", async () => {
    vi.mocked(authApi.me).mockResolvedValue(ME("anonymous", null));
    const { result } = renderHook(() => useCatalog(), { wrapper });

    await waitFor(() => expect(authApi.me).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.catalog).toBeUndefined();
    expect(opportunitiesApi.catalogFor).not.toHaveBeenCalled();
    expect(opportunitiesApi.catalog).not.toHaveBeenCalled();
  });

  it("a signed-in account lets the server use its stored profile", async () => {
    vi.mocked(authApi.me).mockResolvedValue(ME("subscriber", { id: "u1", role: "user" }));
    vi.mocked(profileApi.get).mockResolvedValue({ profile: DEMO_PROFILE, answers: {}, saved: [], demoProfile: DEMO_PROFILE, versions: 1 });
    const { result } = renderHook(() => useCatalog(), { wrapper });

    await waitFor(() => expect(result.current.catalog).toBeDefined());
    expect(opportunitiesApi.catalog).toHaveBeenCalledTimes(1);
    expect(opportunitiesApi.catalogFor).not.toHaveBeenCalled();
  });
});
