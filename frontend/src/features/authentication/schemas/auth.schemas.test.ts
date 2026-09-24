import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schemas";

const valid = { name: "Test User", email: "user@example.com", password: "correct-horse-battery", password_confirmation: "correct-horse-battery", accept_terms: true, accept_privacy: true, marketing_opt_in: false };

describe("registration and login schemas", () => {
  it("accepts complete credentials without marketing consent", () => expect(registerSchema.safeParse(valid).success).toBe(true));
  it.each(["accept_terms", "accept_privacy"])("requires independent %s", key => {
    expect(registerSchema.safeParse({ ...valid, [key]: false, marketing_opt_in: true }).success).toBe(false);
  });
  it("rejects mismatched passwords, short passwords and invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, password_confirmation: "different" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "short", password_confirmation: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
  });
  it("supports legacy identifiers at login", () => {
    expect(loginSchema.safeParse({ username: "legacy", password: "old" }).success).toBe(true);
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });
});