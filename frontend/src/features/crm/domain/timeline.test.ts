import { describe, expect, it } from "vitest";
import type { TimelineEntry } from "../types/crm.types";
import { timelineDetail, timelineLabel } from "./timeline";

const entry = (over: Partial<TimelineEntry>): TimelineEntry => ({ at: "2026-09-20T10:00:00.000Z", kind: "activity", type: "account.login", detail: {}, ...over });

describe("timelineLabel", () => {
  it("names a note by its kind", () => {
    expect(timelineLabel(entry({ kind: "note", type: "note.call", detail: { kind: "call" } }))).toEqual({ kind: "note", noteKind: "call" });
  });

  it("gives the CRM's own events their own labels", () => {
    expect(timelineLabel(entry({ kind: "profile", type: "profile.version" }))).toEqual({ kind: "own", key: "profileVersion" });
    expect(timelineLabel(entry({ kind: "task", type: "task.created" }))).toEqual({ kind: "own", key: "taskCreated" });
    expect(timelineLabel(entry({ kind: "task", type: "task.completed" }))).toEqual({ kind: "own", key: "taskCompleted" });
  });

  it("leaves everything else to the shared activity vocabulary", () => {
    expect(timelineLabel(entry({ type: "opportunity.saved" }))).toEqual({ kind: "activity", type: "opportunity.saved" });
    expect(timelineLabel(entry({ kind: "subscription", type: "subscription.granted" }))).toEqual({ kind: "activity", type: "subscription.granted" });
  });
});

describe("timelineDetail", () => {
  it("previews a note's body, capped", () => {
    const detail = timelineDetail(entry({ kind: "note", type: "note.note", detail: { kind: "note", body: "x".repeat(300) } }));
    expect(detail).toEqual({ kind: "text", text: "x".repeat(180) });
  });

  it("gives a task its due date, or nothing when undated", () => {
    expect(timelineDetail(entry({ kind: "task", type: "task.created", detail: { dueAt: "2026-10-01T00:00:00.000Z" } }))).toEqual({ kind: "due", dueAt: "2026-10-01T00:00:00.000Z" });
    expect(timelineDetail(entry({ kind: "task", type: "task.created", detail: { dueAt: null } }))).toEqual({ kind: "none" });
  });

  it("describes a subscription change by its plan, length, grantor and note", () => {
    const detail = timelineDetail(entry({ kind: "subscription", type: "subscription.granted", detail: { plan: "monthly", days: 30, by: "admin", note: "" } }));
    expect(detail).toEqual({ kind: "grant", parts: { plan: "monthly", days: 30, by: "admin", note: undefined } });
  });

  it("carries a profile version's changes, or none for the first save", () => {
    const changed = [{ field: "employees", from: 28, to: 45 }];
    expect(timelineDetail(entry({ kind: "profile", type: "profile.version", detail: { changed } }))).toEqual({ kind: "profile", changed });
    expect(timelineDetail(entry({ kind: "profile", type: "profile.version", detail: {} }))).toEqual({ kind: "profile", changed: [] });
  });

  it("shows the first useful field of an activity — a title, a search, a field, a stage", () => {
    expect(timelineDetail(entry({ detail: { title: "Call A" } }))).toEqual({ kind: "text", text: "Call A" });
    expect(timelineDetail(entry({ type: "search", detail: { q: "hydrogen" } }))).toEqual({ kind: "text", text: "hydrogen" });
    expect(timelineDetail(entry({ type: "crm.stage", detail: { stage: "won" } }))).toEqual({ kind: "text", text: "won" });
    expect(timelineDetail(entry({ detail: {} }))).toEqual({ kind: "none" });
  });
});
