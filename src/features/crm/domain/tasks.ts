import type { CrmTask, OpenTask } from "../types/crm.types";

const dayOf = (iso: string) => iso.slice(0, 10);

/** The date part of "now" as the server writes due dates (UTC), so "today" agrees with what was stored. */
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** An undone task whose due date is before today. An undated task is never late. */
export function isOverdue(task: Pick<CrmTask, "dueAt" | "doneAt">, today: string): boolean {
  return !task.doneAt && Boolean(task.dueAt) && dayOf(task.dueAt!) < today;
}

/** Splits the open-task list into what is late and what is due today; everything else is neither. */
export function partitionOpenTasks(tasks: OpenTask[], today: string): { overdue: OpenTask[]; dueToday: OpenTask[] } {
  return {
    overdue: tasks.filter((t) => isOverdue(t, today)),
    dueToday: tasks.filter((t) => t.dueAt && dayOf(t.dueAt) === today),
  };
}
