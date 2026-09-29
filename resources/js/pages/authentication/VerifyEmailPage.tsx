import { useState } from "react";
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useMeQuery } from "@/features/authentication/api/auth.queries";
import { LogoutButton } from "@/features/authentication/components/LogoutButton";
import { httpClient } from "@/api/httpClient";
import { Button, Panel } from "@/components/index";

/** Verification remains accessible before granting access to platform features. */
export function VerifyEmailPage() {
  const me = useMeQuery();
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const [message, setMessage] = useState("");
  if (me.isLoading) return null;
  if (!me.data?.user) return <Navigate to="/login" replace />;
  if (me.data.user.emailVerified) return <Navigate to="/app" replace />;
  return <main className="mx-auto max-w-lg p-6"><Panel>
    <h1 className="font-display text-xl font-semibold text-text">{en ? "Verify your email" : "Erősítse meg e-mail-címét"}</h1>
    <p className="mt-1 text-sm text-muted">{en ? "Open the verification link in your email in this browser." : "Nyissa meg az e-mailben kapott megerősítő linket ebben a böngészőben."}</p>
    <div className="mt-5 flex flex-col gap-2">
      <Button onClick={async () => {
        try { await httpClient.post("/auth/verification/resend"); setMessage(en ? "Email queued." : "A levél küldése folyamatban."); }
        catch { setMessage(en ? "Please wait before retrying." : "Kérjük, várjon az újraküldés előtt."); }
      }}>{en ? "Resend email" : "Levél újraküldése"}</Button>
      <Button variant="ghost" onClick={() => me.refetch()}>{en ? "Check verification" : "Megerősítés ellenőrzése"}</Button>
      <LogoutButton className="rounded-md px-4 py-2 text-sm hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" />
    </div>
    {message ? <p role="status" className="mt-3 text-sm text-muted">{message}</p> : null}
  </Panel></main>;
}
