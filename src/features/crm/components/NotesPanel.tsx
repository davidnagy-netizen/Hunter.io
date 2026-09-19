import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, Panel } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import { useAddNoteMutation, useDeleteNoteMutation } from "../api/crm.queries";
import { NOTE_KINDS } from "../domain/vocabulary";
import { noteSchema, type NoteFormValues } from "../schemas/crm.schemas";
import type { CrmNote } from "../types/crm.types";
import "../i18n";

/** What was said, by whom, when — written down after the call so it survives. Each note has a kind (a call is not a decision). */
export function NotesPanel({ contactId, notes }: { contactId: string; notes: CrmNote[] }) {
  const { t } = useTranslation("crm");
  const { dateTime } = useFormat();
  const add = useAddNoteMutation();
  const remove = useDeleteNoteMutation();
  const error = useTranslatedApiError(add.error ?? remove.error);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({ resolver: zodResolver(noteSchema), defaultValues: { text: "", kind: "note" } });

  const onSubmit = (values: NoteFormValues) =>
    add.mutate({ id: contactId, text: values.text, kind: values.kind }, { onSuccess: () => reset({ text: "", kind: values.kind }) });

  return (
    <Panel title={t("notes.title")} subtitle={t("notes.subtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-2">
        <textarea
          aria-label={t("notes.placeholder")}
          placeholder={t("notes.placeholder")}
          rows={3}
          className="rounded-md border border-line-strong px-3 py-2 text-sm"
          {...register("text")}
        />
        {errors.text ? (
          <p role="alert" className="text-xs text-red">
            {t(errors.text.message as string)}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <select aria-label={t("notes.kind")} className="rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm" {...register("kind")}>
            {NOTE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(`notes.kinds.${kind}`)}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={add.isPending}>
            {t("notes.save")}
          </Button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-red">
          {error}
        </p>
      ) : null}

      {notes.length ? (
        <ul className="mt-4 flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-line p-3">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                <b className="font-medium text-text">{t(`notes.kinds.${note.kind}`, { defaultValue: note.kind })}</b>
                <span>{dateTime(note.at)}</span>
                {note.by ? <span>· {note.by}</span> : null}
                <button
                  type="button"
                  className="ml-auto text-red hover:underline"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: contactId, noteId: note.id })}
                >
                  {t("notes.delete")}
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">{t("notes.empty")}</p>
      )}
    </Panel>
  );
}
