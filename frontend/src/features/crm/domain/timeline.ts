import type { ProfileVersionChange } from "@/shared/types/admin.types";
import type { TimelineEntry } from "../types/crm.types";

export type TimelineLabel =
  | { kind: "note"; noteKind: string }
  | { kind: "own"; key: "profileVersion" | "taskCreated" | "taskCompleted" }
  | { kind: "activity"; type: string };

export type TimelineDetail =
  | { kind: "none" }
  | { kind: "text"; text: string }
  | { kind: "due"; dueAt: string }
  | { kind: "grant"; parts: { plan?: string; days?: number; by?: string; note?: string } }
  | { kind: "profile"; changed: ProfileVersionChange[] };

const OWN: Record<string, "profileVersion" | "taskCreated" | "taskCompleted"> = {
  "profile.version": "profileVersion",
  "task.created": "taskCreated",
  "task.completed": "taskCompleted",
};

const NOTE_PREVIEW = 180;

/** What to call an entry: the CRM's own events by name, a note by its kind, everything else by the shared activity vocabulary. */
export function timelineLabel(entry: TimelineEntry): TimelineLabel {
  if (entry.kind === "note") return { kind: "note", noteKind: String(entry.detail.kind ?? "note") };
  const own = OWN[entry.type];
  if (own) return { kind: "own", key: own };
  return { kind: "activity", type: entry.type };
}

/** The second line under an entry, as data — what it says is chosen in the component, in the reader's language. */
export function timelineDetail(entry: TimelineEntry): TimelineDetail {
  const d = entry.detail;
  if (entry.kind === "note") return { kind: "text", text: String(d.body ?? "").slice(0, NOTE_PREVIEW) };
  if (entry.kind === "task") return typeof d.dueAt === "string" && d.dueAt ? { kind: "due", dueAt: d.dueAt } : { kind: "none" };
  if (entry.kind === "subscription") {
    return {
      kind: "grant",
      parts: {
        plan: typeof d.plan === "string" ? d.plan : undefined,
        days: typeof d.days === "number" ? d.days : undefined,
        by: typeof d.by === "string" ? d.by : undefined,
        note: typeof d.note === "string" && d.note ? d.note : undefined,
      },
    };
  }
  if (entry.type === "profile.version") return { kind: "profile", changed: (d.changed as ProfileVersionChange[] | undefined) ?? [] };
  const text = [d.title, d.q, d.field, d.stage].find((v): v is string => typeof v === "string" && v !== "");
  return text ? { kind: "text", text } : { kind: "none" };
}
