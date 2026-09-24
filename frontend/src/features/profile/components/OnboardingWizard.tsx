import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button, Panel, TextField } from "@/shared/components";
import { useMeQuery } from "@/features/authentication/api/auth.queries";
import { useMetaQuery } from "@/shared/api/meta.queries";
import { useCompanyProfile } from "../hooks/useCompanyProfile";
import { CompanyMetricsFields } from "./CompanyMetricsFields";
import { metricsSchema } from "../schemas/metrics.schema";
import type { CompanyMetrics } from "../types/metrics.types";
import type { CompanyProfile } from "../types/profile.types";

/** Existing accounts complete company metrics; project context remains editable separately. */
export function OnboardingWizard() {
  const me = useMeQuery();
  const { profile, isLoading } = useCompanyProfile();
  if (me.isLoading || isLoading) return null;
  if (!me.data?.user) return <Navigate to="/register" replace />;
  if (me.data.user.emailVerified === false) return <Navigate to="/verify-email" replace />;
  return <ProfileEditor key={me.data.user.id} profile={profile} />;
}

/** Server data initializes the editor once; background refetches cannot erase typing. */
function ProfileEditor({ profile }: { profile: CompanyProfile | null }) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const { saveProfile, isSaving } = useCompanyProfile();
  const queryClient = useQueryClient();
  const meta = useMetaQuery();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Partial<CompanyMetrics>>({
    legal_form: profile?.legal_form, headcount: profile?.headcount ?? profile?.employees,
    revenue_band: profile?.revenue_band, exact_revenue: profile?.exact_revenue ?? null,
    teaor_code: profile?.teaor_code, county_code: profile?.county_code,
    closed_business_years: profile?.closed_business_years,
  });
  const [goals, setGoals] = useState(profile?.goals ?? []);
  const [investment, setInvestment] = useState(profile?.investment_value ? String(profile.investment_value) : "");
  const [projectName, setProjectName] = useState(profile?.projectName ?? "");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  async function save() {
    const parsed = metricsSchema.safeParse(metrics);
    if (!parsed.success) { setError(en ? "Complete the company fields." : "Töltse ki a vállalkozás adatait."); setStep(1); return; }
    if (investment && (!Number.isFinite(Number(investment)) || Number(investment) < 0)) {
      setError(en ? "Enter a valid investment amount." : "Érvényes beruházási összeget adjon meg."); return;
    }
    try {
      await saveProfile({
        ...profile, ...parsed.data, metrics_complete: true,
        company: profile?.company ?? "", employees: parsed.data.headcount,
        county: profile?.county ?? "", industryId: profile?.industryId ?? "",
        teaor: parsed.data.teaor_code, goals, investment_value: investment ? Number(investment) : 0,
        projectName, funding_pref: profile?.funding_pref ?? [],
      });
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      navigate("/app");
    } catch { setError(en ? "Could not save. Please check the fields and retry." : "A mentés nem sikerült. Ellenőrizze a mezőket."); }
  }
  return <main className="mx-auto max-w-lg p-6"><Panel>
    <h1 className="text-xl font-semibold">{step === 1 ? (en ? "Company profile" : "Vállalkozás adatai") : (en ? "Project context" : "Projektkörnyezet")}</h1>
    {profile?.company && <p>{profile.company}</p>}
    {step === 1 ? <>
      <CompanyMetricsFields value={metrics} onChange={setMetrics} />
      <Button onClick={() => {
        if (metricsSchema.safeParse(metrics).success) { setStep(2); setError(""); }
        else setError(en ? "Complete all company fields." : "Töltse ki a vállalkozás összes adatát.");
      }}>{en ? "Continue" : "Tovább"}</Button>
    </> : <div className="flex flex-col gap-4">
      <p>{en ? "Project details are optional here and can be completed for each evaluation." : "A projektadatok itt opcionálisak; az értékeléshez később kiegészíthetők."}</p>
      <TextField label={en ? "Project name" : "Projekt neve"} value={projectName} onChange={e => setProjectName(e.target.value)} />
      <TextField label={en ? "Planned investment (HUF)" : "Tervezett beruházás (Ft)"} type="number" min="0" value={investment} onChange={e => setInvestment(e.target.value)} />
      <fieldset><legend>{en ? "Development goals" : "Fejlesztési célok"}</legend>
        {meta.data?.reference.goals.map(goal => <label className="block" key={goal.id}>
          <input type="checkbox" checked={goals.includes(goal.id)} onChange={e => setGoals(current => e.target.checked ? [...current, goal.id] : current.filter(id => id !== goal.id))} />
          {en ? goal.label_en || goal.label : goal.label}
        </label>)}
      </fieldset>
      <Button disabled={isSaving} onClick={save}>{en ? "Save profile" : "Profil mentése"}</Button>
      <Button variant="ghost" onClick={() => setStep(1)}>{en ? "Back" : "Vissza"}</Button>
    </div>}
    {error && <p role="alert">{error}</p>}
  </Panel></main>;
}