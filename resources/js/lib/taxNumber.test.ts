import { describe, expect, it } from "vitest";
import { formatTaxNumber, hasValidCheckDigit, isValidTaxNumber } from "./taxNumber";

describe("isValidTaxNumber", () => {
  it.each(["12345676", "12345676-2-42", "12345676242"])("accepts %s", (value) => {
    expect(isValidTaxNumber(value)).toBe(true);
  });

  it("rejects a number whose check digit is wrong — 12345675 is the same base with the eighth digit off by one", () => {
    expect(isValidTaxNumber("12345675")).toBe(false);
    expect(isValidTaxNumber("12345675-2-42")).toBe(false);
  });

  it.each(["", "1234567", "123456765", "12345676-2", "12345676-2-4", "1234567a", "12345676-22-42", "  "])(
    "rejects a malformed number: %j",
    (value) => {
      expect(isValidTaxNumber(value)).toBe(false);
    },
  );

  it("tolerates surrounding whitespace", () => {
    expect(isValidTaxNumber("  12345676-2-42 ")).toBe(true);
  });
});

describe("hasValidCheckDigit", () => {
  it("uses the weights 9 7 3 1 9 7 3 on the first seven digits", () => {
    // 1·9 + 2·7 + 3·3 + 4·1 + 5·9 + 6·7 + 7·3 = 144 → check digit 6.
    expect(hasValidCheckDigit("12345676")).toBe(true);
    expect(hasValidCheckDigit("12345670")).toBe(false);
  });
});

describe("formatTaxNumber", () => {
  it("adds the dashes to an eleven-digit number", () => {
    expect(formatTaxNumber("12345676242")).toBe("12345676-2-42");
  });

  it("leaves an already-formatted number, a bare base and a half-typed number alone", () => {
    expect(formatTaxNumber("12345676-2-42")).toBe("12345676-2-42");
    expect(formatTaxNumber(" 12345676 ")).toBe("12345676");
    expect(formatTaxNumber("1234")).toBe("1234");
  });
});
