import { useState } from "react";
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useMeQuery, useVerifyEmailMutation } from "@/features/authentication/api/auth.queries";
import { LogoutButton } from "@/features/authentication/components/LogoutButton";
import { httpClient } from "@/api/httpClient";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { Button, Panel, TextField } from "@/components/index";

/** Verification remains accessible before granting access to platform features: the 6-digit code from the e-mail unlocks the account. */
export function VerifyEmailPage() {
  const me = useMeQuery();
  const verify = useVerifyEmailMutation();
  const verifyError = useTranslatedApiError(verify.error);
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  if (me.isLoading) return null;
  if (!me.data?.user) return <Navigate to="/login" replace />;
  if (me.data.user.emailVerified) return <Navigate to="/app" replace />;
  const email = me.data.user.email ?? (en ? "your email address" : "az e-mail-címére");
  return <main className="mx-auto max-w-lg p-6"><Panel>
    <h1 className="font-display text-xl font-semibold text-text">{en ? "Verify your email" : "Erősítse meg e-mail-címét"}</h1>
    <p className="mt-1 text-sm text-muted">{en
      ? `We sent a 6-digit code to ${email}. Enter it below — it is valid for 10 minutes.`
      : `Elküldtünk egy 6 jegyű kódot ide: ${email}. Írja be alább — 10 percig érvényes.`}</p>
    <form className="mt-5 flex flex-col gap-3" noValidate onSubmit={(e) => { e.preventDefault(); verify.mutate(code.trim()); }}>
      <TextField label={en ? "Verification code" : "Megerősítő kód"} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
        className="text-center font-mono text-2xl tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        error={verifyError ?? undefined} />
      <Button type="submit" disabled={verify.isPending || code.length !== 6}>{en ? "Verify" : "Megerősítés"}</Button>
    </form>
    <div className="mt-3 flex flex-col gap-2">
      <Button variant="ghost" onClick={async () => {
        try { await httpClient.post("/auth/verification/resend", undefined, { params: { lang: en ? "en" : "hu" } }); setMessage(en ? "A new code is on its way." : "Az új kódot elküldtük."); }
        catch { setMessage(en ? "Please wait before retrying." : "Kérjük, várjon az újraküldés előtt."); }
      }}>{en ? "Send a new code" : "Új kód küldése"}</Button>
      <LogoutButton className="rounded-md px-4 py-2 text-sm hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" />
    </div>
    {message ? <p role="status" className="mt-3 text-sm text-muted">{message}</p> : null}
  </Panel></main>;
}
