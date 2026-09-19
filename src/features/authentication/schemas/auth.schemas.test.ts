import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schemas";

describe("loginSchema", () => {
  it("accepts any non-empty username and password", () => {
    // Deliberately permissive: login doesn't enforce the register-time
    // username/password format rules — see the comment in auth.schemas.ts.
    const result = loginSchema.safeParse({ username: "a", password: "b" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty username or password", () => {
    expect(loginSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "x", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a valid username/password pair, mirroring the server's rules", () => {
    const result = registerSchema.safeParse({ username: "alfa-gyarto", password: "s3cret" });
    expect(result.success).toBe(true);
  });

  it.each([
    "ab", // below the 3-character minimum
    "a".repeat(33), // above the 32-character maximum
    "invalid username", // spaces are not allowed
    "invalid$", // symbols outside . _ - are not allowed
  ])("rejects an invalid username: %s", (username) => {
    const result = registerSchema.safeParse({ username, password: "validpass" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 4 characters", () => {
    const result = registerSchema.safeParse({ username: "valid-user", password: "abc" });
    expect(result.success).toBe(false);
  });

  it("allows company and email to be omitted", () => {
    const result = registerSchema.safeParse({ username: "valid-user", password: "abcd" });
    expect(result.success).toBe(true);
  });

  it("allows an empty-string email (an untouched optional field)", () => {
    const result = registerSchema.safeParse({ username: "valid-user", password: "abcd", email: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email when one is provided", () => {
    const result = registerSchema.safeParse({ username: "valid-user", password: "abcd", email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});
