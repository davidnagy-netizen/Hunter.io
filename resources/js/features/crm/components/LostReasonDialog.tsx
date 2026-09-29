import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog } from "@/components";
import "../i18n";

/** The "why was it lost?" question, replacing the legacy `prompt()`. Answering is optional. */
export function LostReasonDialog({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const { t } = useTranslation("crm");
  const [reason, setReason] = useState("");

  return (
    <Dialog title={t("lostDialog.title")} icon="question" onClose={onCancel}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(reason);
        }}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          {t("lostDialog.field")}
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={300}
            rows={3}
            className="swal2-textarea rounded-md border border-line-strong px-3 py-2 text-sm font-normal"
          />
        </label>
        <div className="swal2-actions flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" className="swal2-cancel" onClick={onCancel}>
            {t("lostDialog.cancel")}
          </Button>
          <Button type="submit" variant="danger" size="sm" className="swal2-confirm">
            {t("lostDialog.confirm")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
