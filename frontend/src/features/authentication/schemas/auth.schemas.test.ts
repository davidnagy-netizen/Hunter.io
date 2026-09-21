import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, suggestUsername, usernameSchema } from "./auth.schemas";

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

const VALID = { email: "info@alfa.hu", password: "s3cret", taxNumber: "12345674-2-42", acceptTerms: true };

describe("registerSchema", () => {
  it("accepts email, password, tax number and the terms consent — marketing consent is optional", () => {
    expect(registerSchema.safeParse(VALID).success).toBe(true);
    expect(registerSchema.safeParse({ ...VALID, marketingOptIn: true }).success).toBe(true);
  });

  it("requires the terms consent: an unticked box is not consent", () => {
    const result = registerSchema.safeParse({ ...VALID, acceptTerms: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("authentication:validation.terms");
  });

  it("does not let marketing consent stand in for the terms consent", () => {
    expect(registerSchema.safeParse({ ...VALID, acceptTerms: false, marketingOptIn: true }).success).toBe(false);
  });

  it("requires an email, and a well-formed one", () => {
    expect(registerSchema.safeParse({ ...VALID, email: "" }).error?.issues[0].message).toBe("errors:EMAIL_REQUIRED");
    expect(registerSchema.safeParse({ ...VALID, email: "not-an-email" }).error?.issues[0].message).toBe("errors:INVALID_EMAIL");
  });

  it("rejects a password shorter than 4 characters", () => {
    expect(registerSchema.safeParse({ ...VALID, password: "abc" }).error?.issues[0].message).toBe("errors:WEAK_PASSWORD");
  });

  it("checks the tax number's shape and check digit before anything is sent to NAV", () => {
    expect(registerSchema.safeParse({ ...VALID, taxNumber: "12345675-2-42" }).error?.issues[0].message).toBe("authentication:validation.taxNumber");
    expect(registerSchema.safeParse({ ...VALID, taxNumber: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...VALID, taxNumber: "12345674" }).success).toBe(true);
  });
});

describe("usernameSchema", () => {
  it("mirrors the server's username rule", () => {
    expect(usernameSchema.safeParse({ username: "alfa-gyarto" }).success).toBe(true);
    for (const username of ["ab", "a".repeat(33), "invalid username", "invalid$"]) {
      expect(usernameSchema.safeParse({ username }).success).toBe(false);
    }
  });
});

describe("suggestUsername", () => {
  it("offers the part of the email before the @", () => {
    expect(suggestUsername("info@alfa.hu")).toBe("info");
  });

  it("drops characters a username may not hold and always yields a valid one", () => {
    for (const email of ["kis józsi+pályázat@x.hu", "ő@x.hu", "@x.hu", "", "a@b.c", "x".repeat(60) + "@y.hu"]) {
      expect(usernameSchema.safeParse({ username: suggestUsername(email) }).success, email).toBe(true);
    }
    expect(suggestUsername("kis józsi+pályázat@x.hu")).toBe("kisjzsiplyzat");
  });
});
