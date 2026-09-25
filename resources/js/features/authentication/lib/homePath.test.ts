import { describe, expect, it } from "vitest";
import { homePathFor } from "./homePath";

describe("homePathFor", () => {
  it("sends an administrator to the admin console", () => {
    expect(homePathFor({ role: "admin" })).toBe("/admin");
  });

  it("sends everyone else to the app", () => {
    expect(homePathFor({ role: "user" })).toBe("/app");
    expect(homePathFor(null)).toBe("/app");
    expect(homePathFor(undefined)).toBe("/app");
  });
});
