import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button, TextField } from "@/components";
import { CompanyMetricsFields } from "@/features/profile/components/CompanyMetricsFields";
import { metricsSchema } from "@/features/profile/schemas/metrics.schema";
import type { CompanyMetrics } from "@/features/profile/types/metrics.types";
import { useRegisterMutation, useTaxpayerLookupMutation } from "../api/auth.queries";
import { formatTaxNumber, isValidTaxNumber } from "@/lib/taxNumber";
import type { Taxpayer } from "../types/auth.types";
import { registerSchema as credentialsSchema, type RegisterFormValues as Credentials } from "../schemas/auth.schemas";
import "../i18n";

/** Credentials and consents deliberately never enter browser storage. */
export interface RegisterFormProps { onSuccess?: (taxpayer: Taxpayer) => void }
const STORAGE_KEY = "fundor-registration-v2";

/** Restore only explicitly allowlisted noncredential fields from this tab. */
function restoreDraft(): { taxNumber: string; metrics: Partial<CompanyMetrics> } {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
    const result = z.object({ taxNumber: z.string().optional(), metrics: metricsSchema.partial().optional() }).safeParse(parsed);
    return { taxNumber: result.success ? result.data.taxNumber ?? "" : "", metrics: result.success ? result.data.metrics ?? {} : {} };
  } catch { return { taxNumber: "", metrics: {} }; }
}

/** CR-03: tax identity → metrics → credentials, with an expiring server-issued receipt. */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const [draft] = useState(restoreDraft);
  const [taxNumber, setTaxNumber] = useState(draft.taxNumber);
  const [metrics, setMetrics] = useState<Partial<CompanyMetrics>>({ exact_revenue: null, ...draft.metrics });
  const [step, setStep] = useState(1);
  const [taxpayer, setTaxpayer] = useState<Taxpayer | null>(null);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);
  const lookup = useTaxpayerLookupMutation();
  const registration = useRegisterMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "", accept_terms: false, accept_privacy: false, marketing_opt_in: false },
  });
  function persist(number: string, facts: Partial<CompanyMetrics>) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ taxNumber: number, metrics: facts })); } catch { /* Storage may be disabled; in-memory navigation still works. */ }
  }
  function changeTax(raw: string) {
    requestVersion.current++;
    const value = formatTaxNumber(raw);
    setTaxNumber(value); setTaxpayer(null); setError(""); persist(value, metrics);
  }
  async function findCompany() {
    const version = ++requestVersion.current;
    setError("");
    try {
      const found = await lookup.mutateAsync(taxNumber.trim());
      if (version === requestVersion.current) setTaxpayer(found);
    } catch { if (version === requestVersion.current) setError(en ? "NAV verification is unavailable. Please retry." : "A NAV ellenőrzés nem sikerült. Kérjük, próbálja újra."); }
  }
  async function finish(credentials: Credentials) {
    const parsed = metricsSchema.safeParse(metrics);
    if (!taxpayer?.verificationReceipt || !parsed.success) return;
    setError("");
    try {
      await registration.mutateAsync({ ...credentials, verification_receipt: taxpayer.verificationReceipt, metrics: parsed.data });
      sessionStorage.removeItem(STORAGE_KEY);
      onSuccess?.(taxpayer);
    } catch { setError(en ? "Registration failed. Check your details; if verification expired, repeat the tax lookup." : "A regisztráció nem sikerült. Ellenőrizze adatait; lejárt ellenőrzés esetén ismételje meg az adókeresést."); }
  }
  return <div className="flex flex-col gap-4">
    <p aria-live="polite">{en ? "Step" : "Lépés"} {step}/3</p>
    {step === 1 && <>
      <TextField label={en ? "Tax number" : "Adószám"} value={taxNumber} onChange={e => changeTax(e.target.value)} inputMode="numeric"
        error={taxNumber && !isValidTaxNumber(taxNumber) ? (en ? "Invalid or incomplete tax number." : "Érvénytelen vagy hiányos adószám.") : undefined} />
      <Button onClick={findCompany} disabled={!isValidTaxNumber(taxNumber) || lookup.isPending}>{lookup.isPending ? (en ? "Searching…" : "Keresés…") : (en ? "Find company" : "Cég keresése")}</Button>
      {taxpayer && <section aria-label={en ? "Verified company" : "Ellenőrzött vállalkozás"} className="rounded border border-line p-3">
        <p>{taxpayer.companyName}</p><p>{taxpayer.shortName}</p><p>{taxpayer.taxNumber}</p>
        <p>{taxpayer.fullAddress || (en ? "NAV did not provide a headquarters address." : "A NAV nem adott meg székhelycímet.")}</p>
      </section>}
      <Button disabled={!taxpayer} onClick={() => setStep(2)}>{en ? "Confirm and continue" : "Megerősítés és tovább"}</Button>
    </>}
    {step === 2 && <>
      <CompanyMetricsFields value={metrics} onChange={value => { setMetrics(value); persist(taxNumber, value); }} />
      <Button onClick={() => {
        if (metricsSchema.safeParse(metrics).success) { setError(""); setStep(3); }
        else setError(en ? "Complete all company fields with valid values." : "Töltse ki érvényesen a vállalkozás összes adatát.");
      }}>{en ? "Continue" : "Tovább"}</Button>
    </>}
    {step === 3 && <form onSubmit={handleSubmit(finish)} className="flex flex-col gap-4" noValidate>
      <TextField label={en ? "Contact name" : "Kapcsolattartó neve"} autoComplete="name" {...register("name")} error={errors.name?.message} />
      <TextField label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
      <TextField label={en ? "Password (at least 12 characters)" : "Jelszó (legalább 12 karakter)"} type="password" autoComplete="new-password" {...register("password")} error={errors.password?.message} />
      <TextField label={en ? "Confirm password" : "Jelszó megerősítése"} type="password" autoComplete="new-password" {...register("password_confirmation")} error={errors.password_confirmation?.message} />
      <label><input type="checkbox" {...register("accept_terms")} /> {en ? "I accept the Terms of Service" : "Elfogadom az Általános Szerződési Feltételeket"}</label>
      <label><input type="checkbox" {...register("accept_privacy")} /> {en ? "I acknowledge the Privacy Notice" : "Tudomásul veszem az Adatkezelési tájékoztatót"}</label>
      <label><input type="checkbox" {...register("marketing_opt_in")} />{en ? "Receive funding opportunity updates" : "Kérek pályázati és finanszírozási értesítéseket"}</label>
      {(errors.accept_terms || errors.accept_privacy) && <p role="alert">{en ? "Accept the terms and acknowledge the privacy notice separately." : "Az ÁSZF és az adatkezelési tájékoztató külön elfogadása szükséges."}</p>}
      <Button type="submit" disabled={registration.isPending}>{en ? "Create account" : "Fiók létrehozása"}</Button>
    </form>}
    {step > 1 && <Button variant="ghost" onClick={() => { setStep(step - 1); setError(""); }}>{en ? "Back" : "Vissza"}</Button>}
    {error && <p role="alert" className="text-red">{error}</p>}
  </div>;
}
