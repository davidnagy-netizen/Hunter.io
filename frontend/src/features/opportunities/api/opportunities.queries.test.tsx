import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { authApi } from "@/shared/api/auth.api";
import { DEMO_PROFILE } from "@/shared/data/demoProfile";
import { useLocalProfileStore } from "@/shared/store/localProfileStore";
import { profileApi } from "@/shared/api/profile.api";
import { useUiStore } from "@/shared/store/uiStore";
import { useSaveProfileMutation } from "@/shared/api/profile.queries";
import { opportunitiesApi } from "./opportunities.api";
import { useCatalog, useSearchQuery } from "./opportunities.queries";
import { EMPTY_SEARCH } from "../domain/searchState";

vi.mock("@/shared/api/auth.api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() } }));
vi.mock("@/shared/api/profile.api", () => ({ profileApi: { get: vi.fn(), save: vi.fn(), loadDemo: vi.fn(), history: vi.fn(), restore: vi.fn() } }));
vi.mock("@/shared/api/answers.api", () => ({ answersApi: { save: vi.fn() } }));
vi.mock("./opportunities.api", () => ({
  opportunitiesApi: { catalog: vi.fn(), catalogFor: vi.fn(), search: vi.fn(), searchFor: vi.fn(), detail: vi.fn(), toggleSaved: vi.fn() },
}));

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
    expect(opportunitiesApi.catalogFor).toHaveBeenCalledWith(DEMO_PROFILE, "hu");
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
    expect(opportunitiesApi.catalog).toHaveBeenCalledWith("hu");
    expect(opportunitiesApi.catalogFor).not.toHaveBeenCalled();
  });

  it("asks again, in the new language, when the language changes: the server words the explanations", async () => {
    vi.mocked(authApi.me).mockResolvedValue(ME("subscriber", { id: "u1", role: "user" }));
    vi.mocked(profileApi.get).mockResolvedValue({ profile: DEMO_PROFILE, answers: {}, saved: [], demoProfile: DEMO_PROFILE, versions: 1 });
    const { result } = renderHook(() => useCatalog(), { wrapper });
    await waitFor(() => expect(result.current.catalog).toBeDefined());

    act(() => useUiStore.getState().setLang("en"));
    await waitFor(() => expect(opportunitiesApi.catalog).toHaveBeenCalledWith("en"));
    act(() => useUiStore.getState().setLang("hu"));
  });

  it("is refetched when the account's profile is saved: the server scored it for the old profile", async () => {
    vi.mocked(authApi.me).mockResolvedValue(ME("subscriber", { id: "u1", role: "user" }));
    vi.mocked(profileApi.get).mockResolvedValue({ profile: DEMO_PROFILE, answers: {}, saved: [], demoProfile: DEMO_PROFILE, versions: 1 });
    vi.mocked(profileApi.save).mockResolvedValue({ success: true, profile: DEMO_PROFILE } as never);
    const { result } = renderHook(() => ({ catalog: useCatalog(), save: useSaveProfileMutation() }), { wrapper });
    await waitFor(() => expect(result.current.catalog.catalog).toBeDefined());
    expect(opportunitiesApi.catalog).toHaveBeenCalledTimes(1);

    await act(() => result.current.save.mutateAsync(DEMO_PROFILE));
    await waitFor(() => expect(opportunitiesApi.catalog).toHaveBeenCalledTimes(2));
  });
});

describe("useSearchQuery", () => {
  beforeEach(() => {
    vi.mocked(opportunitiesApi.search).mockResolvedValue({ results: [] } as never);
    vi.mocked(opportunitiesApi.searchFor).mockResolvedValue({ results: [] } as never);
  });

  it("an anonymous visitor's search carries their browser-held profile in the body", async () => {
    vi.mocked(authApi.me).mockResolvedValue(ME("anonymous", null));
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    const { result } = renderHook(() => useSearchQuery({ ...EMPTY_SEARCH, q: "ai" }, "en"), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    const [request, profile] = vi.mocked(opportunitiesApi.searchFor).mock.calls[0];
    expect(new URLSearchParams(request).get("q")).toBe("ai");
    expect(new URLSearchParams(request).get("lang")).toBe("en");
    expect(profile).toEqual(DEMO_PROFILE);
    expect(opportunitiesApi.search).not.toHaveBeenCalled();
  });

  it("a signed-in account searches with just the query — the server has its profile", async () => {
    vi.mocked(authApi.me).mockResolvedValue(ME("subscriber", { id: "u1", role: "user" }));
    vi.mocked(profileApi.get).mockResolvedValue({ profile: DEMO_PROFILE, answers: {}, saved: [], demoProfile: DEMO_PROFILE, versions: 1 });
    const { result } = renderHook(() => useSearchQuery(EMPTY_SEARCH, "hu"), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(opportunitiesApi.search).toHaveBeenCalledTimes(1);
    expect(opportunitiesApi.searchFor).not.toHaveBeenCalled();
  });

  it("searches again when the query changes, not when nothing did", async () => {
    vi.mocked(authApi.me).mockResolvedValue(ME("subscriber", { id: "u1", role: "user" }));
    vi.mocked(profileApi.get).mockResolvedValue({ profile: DEMO_PROFILE, answers: {}, saved: [], demoProfile: DEMO_PROFILE, versions: 1 });
    const { result, rerender } = renderHook(({ q }) => useSearchQuery({ ...EMPTY_SEARCH, q }, "hu"), { wrapper, initialProps: { q: "a" } });
    await waitFor(() => expect(result.current.data).toBeDefined());

    rerender({ q: "a" });
    expect(opportunitiesApi.search).toHaveBeenCalledTimes(1);
    rerender({ q: "b" });
    await waitFor(() => expect(opportunitiesApi.search).toHaveBeenCalledTimes(2));
  });
});
