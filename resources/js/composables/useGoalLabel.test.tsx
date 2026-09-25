import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/i18n/i18n";
import { metaApi } from "@/api/meta.api";
import { useUiStore } from "@/store/uiStore";
import type { MetaResponse } from "@/types/reference.types";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useGoalLabel } from "./useGoalLabel";

vi.mock("@/api/meta.api", () => ({ metaApi: { get: vi.fn() } }));

const META = {
  catalog: null,
  reference: { regions: [], industries: [], goals: [{ id: "digitalization", label: "Digitalizáció", label_en: "Digitalisation" }], revBands: [], orgTypes: [] },
  labels: { programmes: {}, actions: {} },
  optionalProfileFields: [],
  today: "2026-09-20",
} as MetaResponse;

function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useGoalLabel(), { wrapper });
}

beforeEach(() => {
  vi.mocked(metaApi.get).mockResolvedValue(META);
  useUiStore.getState().setLang("hu");
});

describe("useGoalLabel", () => {
  it("shows the id until the reference data arrives", () => {
    const { result } = setup();
    expect(result.current("digitalization")).toBe("digitalization");
  });

  it("names a goal in the active language once it has", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current("digitalization")).toBe("Digitalizáció"));
    useUiStore.getState().setLang("en");
    await waitFor(() => expect(result.current("digitalization")).toBe("Digitalisation"));
  });

  it("leaves a goal it doesn't know as it is", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current("digitalization")).toBe("Digitalizáció"));
    expect(result.current("mystery")).toBe("mystery");
  });
});
