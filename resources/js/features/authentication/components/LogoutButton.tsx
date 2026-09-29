import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, ExitIcon } from "@/components";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { useLogoutMutation } from "../api/auth.queries";
import "../i18n";

export function LogoutButton({ className = "", iconOnly = false, onSuccess }: {
  className?: string;
  iconOnly?: boolean;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation("authentication");
  const [open, setOpen] = useState(false);
  const logout = useLogoutMutation();
  const error = useTranslatedApiError(logout.error);
  const close = () => { if (!logout.isPending) setOpen(false); };

  return <>
    <button type="button" className={className} aria-label={t("logout.confirm")} title={t("logout.confirm")}
      disabled={logout.isPending} onClick={() => { logout.reset(); setOpen(true); }}>
      {iconOnly ? <ExitIcon /> : t("logout.confirm")}
    </button>
    {open ? <Dialog title={t("logout.question")} icon="question" onClose={close}>
      {error ? <p role="alert" className="mb-3 text-sm text-red [overflow-wrap:anywhere]">{error}</p> : null}
      <div className="swal2-actions mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" className="swal2-cancel" disabled={logout.isPending} onClick={close}>{t("logout.cancel")}</Button>
        <Button className="swal2-confirm" disabled={logout.isPending} onClick={() => logout.mutate(undefined, {
          onSuccess: () => { setOpen(false); onSuccess?.(); },
        })}>{t("logout.confirm")}</Button>
      </div>
    </Dialog> : null}
  </>;
}
