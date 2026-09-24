import { useState } from "react";
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useMeQuery, useLogoutMutation } from "../api/auth.queries";
import { httpClient } from "@/shared/api/httpClient";
import { Button, Panel } from "@/shared/components";

/** Verification remains accessible before granting access to platform features. */
export function VerifyEmailPage() {
  const me = useMeQuery();
  const logout = useLogoutMutation();
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const [message, setMessage] = useState("");
  if (me.isLoading) return null;
  if (!me.data?.user) return <Navigate to="/login" replace />;
  if (me.data.user.emailVerified) return <Navigate to="/app" replace />;
  return <main className="mx-auto max-w-lg p-6"><Panel>
    <h1>{en ? "Verify your email" : "Erősítse meg e-mail-címét"}</h1>
    <p>{en ? "Open the verification link in your email in this browser." : "Nyissa meg az e-mailben kapott megerősítő linket ebben a böngészőben."}</p>
    <Button onClick={async () => {
      try { await httpClient.post("/auth/verification/resend"); setMessage(en ? "Email queued." : "A levél küldése folyamatban."); }
      catch { setMessage(en ? "Please wait before retrying." : "Kérjük, várjon az újraküldés előtt."); }
    }}>{en ? "Resend email" : "Levél újraküldése"}</Button>
    <Button variant="ghost" onClick={() => me.refetch()}>{en ? "Check verification" : "Megerősítés ellenőrzése"}</Button>
    <Button variant="ghost" onClick={() => logout.mutate()}>{en ? "Log out" : "Kijelentkezés"}</Button>
    <p role="status">{message}</p>
  </Panel></main>;
}
