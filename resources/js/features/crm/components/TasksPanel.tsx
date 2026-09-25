import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, Panel } from "@/components";
import { useFormat } from "@/composables/useFormat";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { useAddTaskMutation, useDeleteTaskMutation, useSetTaskDoneMutation } from "../api/crm.queries";
import { isOverdue, todayKey } from "../domain/tasks";
import { taskSchema, type TaskFormValues } from "../schemas/crm.schemas";
import type { CrmTask } from "../types/crm.types";
import "../i18n";

/** The next steps for this contact. Finished tasks stay listed (struck through); an undone task past its date is flagged. */
export function TasksPanel({ contactId, tasks }: { contactId: string; tasks: CrmTask[] }) {
  const { t } = useTranslation("crm");
  const { date } = useFormat();
  const add = useAddTaskMutation();
  const setDone = useSetTaskDoneMutation();
  const remove = useDeleteTaskMutation();
  const error = useTranslatedApiError(add.error ?? setDone.error ?? remove.error);
  const today = todayKey();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: { title: "", dueAt: "" } });

  const onSubmit = (values: TaskFormValues) =>
    add.mutate({ id: contactId, title: values.title, dueAt: values.dueAt || undefined }, { onSuccess: () => reset({ title: "", dueAt: "" }) });

  return (
    <Panel title={t("tasks.title")}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-start gap-2">
        <div className="min-w-40 flex-1">
          <input
            aria-label={t("tasks.placeholder")}
            placeholder={t("tasks.placeholder")}
            className="w-full rounded-md border border-line-strong px-3 py-2 text-sm"
            {...register("title")}
          />
          {errors.title ? (
            <p role="alert" className="mt-1 text-xs text-red">
              {t(errors.title.message as string)}
            </p>
          ) : null}
        </div>
        <input type="date" aria-label={t("tasks.due")} className="rounded-md border border-line-strong px-2 py-2 text-sm" {...register("dueAt")} />
        <Button type="submit" size="sm" disabled={add.isPending}>
          {t("tasks.add")}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-red">
          {error}
        </p>
      ) : null}

      {tasks.length ? (
        <ul className="mt-4 flex flex-col divide-y divide-line">
          {tasks.map((task) => {
            const late = isOverdue(task, today);
            return (
              <li key={task.id} className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  aria-label={t("tasks.done")}
                  checked={Boolean(task.doneAt)}
                  disabled={setDone.isPending}
                  onChange={(event) => setDone.mutate({ id: contactId, taskId: task.id, done: event.target.checked })}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className={["text-sm", task.doneAt ? "text-muted line-through" : ""].join(" ")}>{task.title}</div>
                  <div className={["text-xs", late ? "text-red" : "text-muted"].join(" ")}>
                    {task.dueAt ? date(task.dueAt) : t("tasks.noDue")}
                    {task.by ? ` · ${task.by}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-red hover:underline"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: contactId, taskId: task.id })}
                >
                  {t("tasks.delete")}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">{t("tasks.empty")}</p>
      )}
    </Panel>
  );
}
