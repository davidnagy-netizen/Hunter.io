import { describe, expect, it } from "vitest";
import { parseTags } from "./tags";

describe("parseTags", () => {
  it("splits on commas and trims", () => {
    expect(parseTags("vip,  warm ,hungary")).toEqual(["vip", "warm", "hungary"]);
  });

  it("drops empty pieces", () => {
    expect(parseTags(" , ,vip,, ")).toEqual(["vip"]);
    expect(parseTags("")).toEqual([]);
  });
});
