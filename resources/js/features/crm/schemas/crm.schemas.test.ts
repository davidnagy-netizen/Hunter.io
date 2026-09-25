import { describe, expect, it } from "vitest";
import { classificationSchema, noteSchema, taskSchema } from "./crm.schemas";

describe("noteSchema", () => {
  it("needs some text, whatever the kind", () => {
    expect(noteSchema.safeParse({ text: "  ", kind: "call" }).success).toBe(false);
    expect(noteSchema.safeParse({ text: "Asked for a quote", kind: "call" }).success).toBe(true);
  });

  it("only allows the known kinds", () => {
    expect(noteSchema.safeParse({ text: "x", kind: "smoke-signal" }).success).toBe(false);
  });

  it("reports an empty note with its i18n key", () => {
    const result = noteSchema.safeParse({ text: "", kind: "note" });
    expect(!result.success && result.error.issues[0].message).toBe("crm:validation.note");
  });
});

describe("taskSchema", () => {
  it("needs a title but not a date", () => {
    expect(taskSchema.safeParse({ title: "Call back", dueAt: "" }).success).toBe(true);
    expect(taskSchema.safeParse({ title: " ", dueAt: "2026-10-01" }).success).toBe(false);
  });
});

describe("classificationSchema", () => {
  it("allows an empty owner and empty tags — clearing them is a real edit", () => {
    expect(classificationSchema.safeParse({ owner: "", tags: "" }).success).toBe(true);
  });

  it("caps the owner's length", () => {
    expect(classificationSchema.safeParse({ owner: "x".repeat(61), tags: "" }).success).toBe(false);
  });
});
