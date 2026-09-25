import { describe, expect, it } from "vitest";
import { grantSchema } from "./grant.schema";

describe("grantSchema", () => {
  it("needs only a plan; days and note are optional", () => {
    expect(grantSchema.safeParse({ planId: "monthly" }).success).toBe(true);
  });

  it("accepts a positive whole number of days", () => {
    expect(grantSchema.safeParse({ planId: "monthly", days: 45 }).success).toBe(true);
  });

  it.each([0, -3, 1.5, Number.NaN])("rejects %s days", (days) => {
    const result = grantSchema.safeParse({ planId: "monthly", days });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("admin:validation.days");
  });

  it("rejects a missing plan", () => {
    const result = grantSchema.safeParse({ planId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an over-long note", () => {
    expect(grantSchema.safeParse({ planId: "trial", note: "x".repeat(201) }).success).toBe(false);
  });
});
