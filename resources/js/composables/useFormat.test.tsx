import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@/i18n/i18n";
import { useFormat } from "./useFormat";

describe("useFormat().moneyOrDash", () => {
  it("formats a known amount", () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.moneyOrDash(5990).replace(/\s/g, "")).toMatch(/^5990(Ft|HUF)$/);
  });

  it("shows a dash for an unknown amount — never a made-up zero", () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.moneyOrDash(null)).toBe("—");
    expect(result.current.moneyOrDash(undefined)).toBe("—");
  });

  it("still shows a real zero as zero", () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.moneyOrDash(0)).toMatch(/^0\s?(Ft|HUF)$/);
  });
});
