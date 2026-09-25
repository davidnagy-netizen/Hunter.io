import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, Panel, TextField } from "@/components";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { useUpdateContactMutation } from "../api/crm.queries";
import { parseTags } from "../domain/tags";
import { classificationSchema, type ClassificationFormValues } from "../schemas/crm.schemas";
import type { CrmContact } from "../types/crm.types";
import "../i18n";

/** Who owns this relationship and how it's tagged. Clearing a field is a real edit and is sent as such. */
export function ClassificationPanel({ contact }: { contact: Pick<CrmContact, "id" | "owner" | "tags"> }) {
  const { t } = useTranslation("crm");
  const update = useUpdateContactMutation();
  const error = useTranslatedApiError(update.error);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassificationFormValues>({
    resolver: zodResolver(classificationSchema),
    defaultValues: { owner: contact.owner ?? "", tags: contact.tags.join(", ") },
  });

  const onSubmit = (values: ClassificationFormValues) => update.mutate({ id: contact.id, owner: values.owner, tags: parseTags(values.tags) });

  return (
    <Panel title={t("classification.title")}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        <TextField label={t("classification.owner")} error={errors.owner && t(errors.owner.message as string)} {...register("owner")} />
        <TextField label={t("classification.tags")} {...register("tags")} />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" variant="ghost" disabled={update.isPending}>
            {t("classification.save")}
          </Button>
          {error ? (
            <span role="alert" className="text-xs text-red">
              {error}
            </span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}
