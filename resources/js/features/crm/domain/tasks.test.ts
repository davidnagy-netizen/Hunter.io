import { describe, expect, it } from "vitest";
import type { OpenTask } from "../types/crm.types";
import { isOverdue, partitionOpenTasks, todayKey } from "./tasks";

const task = (over: Partial<OpenTask>): OpenTask => ({
  id: "t", at: "2026-09-01T00:00:00.000Z", by: null, title: "call", dueAt: null, doneAt: null, doneBy: null,
  subjectId: "u1", subjectKind: "account", company: null, username: null, ...over,
});

describe("todayKey", () => {
  it("is the UTC date, the way due dates are stored", () => {
    expect(todayKey(new Date("2026-09-20T23:30:00.000Z"))).toBe("2026-09-20");
  });
});

describe("isOverdue", () => {
  it("is late only when the due day is before today", () => {
    expect(isOverdue({ dueAt: "2026-09-19T00:00:00.000Z", doneAt: null }, "2026-09-20")).toBe(true);
    expect(isOverdue({ dueAt: "2026-09-20T00:00:00.000Z", doneAt: null }, "2026-09-20")).toBe(false);
    expect(isOverdue({ dueAt: "2026-09-21T00:00:00.000Z", doneAt: null }, "2026-09-20")).toBe(false);
  });

  it("never flags an undated or a finished task", () => {
    expect(isOverdue({ dueAt: null, doneAt: null }, "2026-09-20")).toBe(false);
    expect(isOverdue({ dueAt: "2026-01-01T00:00:00.000Z", doneAt: "2026-01-02T00:00:00.000Z" }, "2026-09-20")).toBe(false);
  });
});

describe("partitionOpenTasks", () => {
  it("separates late from due-today and ignores the rest", () => {
    const late = task({ id: "a", dueAt: "2026-09-10T00:00:00.000Z" });
    const today = task({ id: "b", dueAt: "2026-09-20T00:00:00.000Z" });
    const later = task({ id: "c", dueAt: "2026-10-01T00:00:00.000Z" });
    const undated = task({ id: "d" });
    const result = partitionOpenTasks([late, today, later, undated], "2026-09-20");
    expect(result.overdue.map((t) => t.id)).toEqual(["a"]);
    expect(result.dueToday.map((t) => t.id)).toEqual(["b"]);
  });
});
