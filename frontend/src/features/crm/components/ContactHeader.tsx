import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Badge, Button, Dialog } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import { SubscriptionBadge } from "@/features/authentication/components/SubscriptionBadge";
import { useDeleteLeadMutation } from "../api/crm.queries";
import type { CrmContact, Vocabulary } from "../types/crm.types";
import { LifecycleBadge } from "./LifecycleBadge";
import { StageSelect } from "./StageSelect";
import "../i18n";

export interface ContactHeaderProps {
  /** Where to go once a lead has been deleted. */
  backTarget: string;
  contact: CrmContact;
  vocabulary: Vocabulary;
  labels: { lifecycle: (id: string) => string; source: (id: string) => string };
  onMove: (stage: string) => void;
}

/** Who this is, where they stand, and the two things you do from the top: move them along, or (for an account) jump to its history / (for a lead) delete it. */
export function ContactHeader({ backTarget, contact, vocabulary, labels, onMove }: ContactHeaderProps) {
  const { t } = useTranslation("crm");
  const { date } = useFormat();
  const navigate = useNavigate();
  const deleteLead = useDeleteLeadMutation();
  const deleteError = useTranslatedApiError(deleteLead.error);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const name = contact.company || contact.username || contact.email || "—";
  const isAccount = contact.kind === "account";
  const sub = [contact.username ?? contact.contactName, contact.email, contact.phone].filter(Boolean).join(" · ");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-white">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold text-ink">{name}</h1>
          {sub ? <p className="text-sm text-muted">{sub}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LifecycleBadge lifecycle={contact.lifecycle} label={labels.lifecycle(contact.lifecycle)} />
            {isAccount ? <SubscriptionBadge subscription={contact.subscription} /> : null}
            {contact.disabled ? <Badge tone="red">{t("contact.disabled")}</Badge> : null}
            <span className="text-xs text-muted">
              {labels.source(contact.source)} · {t("contact.arrived", { date: date(contact.createdAt) })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StageSelect value={contact.stage} stages={vocabulary.stages} onChange={onMove} className="py-2 text-sm" />
          {isAccount ? (
            <Link to={`/admin/users/${contact.id}`} className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-paper">
              {t("contact.history")}
            </Link>
          ) : (
            <Button size="sm" variant="danger" onClick={() => setConfirmingDelete(true)}>
              {t("contact.delete")}
            </Button>
          )}
        </div>
      </div>

      {contact.lostReason ? (
        <p className="mb-4 rounded-md bg-amber-bg p-3 text-sm text-amber">
          {t("contact.lostReason")} {contact.lostReason}
        </p>
      ) : null}

      {confirmingDelete ? (
        <Dialog title={t("contact.deleteDialog.title")} onClose={() => setConfirmingDelete(false)}>
          <p className="text-sm text-muted">{t("contact.deleteDialog.body")}</p>
          {deleteError ? (
            <p role="alert" className="mt-2 text-xs text-red">
              {deleteError}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
              {t("contact.deleteDialog.cancel")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteLead.isPending}
              onClick={() => deleteLead.mutate(contact.id, { onSuccess: () => navigate(backTarget) })}
            >
              {t("contact.deleteDialog.confirm")}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
