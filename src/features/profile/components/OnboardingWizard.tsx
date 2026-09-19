import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button, ChipButton, LanguageToggle, Panel, SelectField, TextField } from "@/shared/components";
import { useMetaQuery } from "@/shared/api/meta.queries";
import type { Region } from "@/shared/types/reference.types";
import { useCompanyProfile } from "../hooks/useCompanyProfile";
import { companyProfileSchema, STEP_FIELDS, type CompanyProfileFormValues } from "../schemas/profile.schemas";
import "../i18n";

const STEPS = ["intro", "company", "activity", "goals", "investment", "setup"] as const;
type Step = (typeof STEPS)[number];

const CLOSED_YEARS_OPTIONS = [0, 1, 4] as const;
const FUNDING_PREF_KEYS = ["non_refundable", "loan_ok", "EU", "HU"] as const;

function regionForCounty(county: string, regions: Region[]): string | undefined {
  return regions.find((r) => r.counties.includes(county))?.code;
}

const DEFAULT_VALUES: Partial<CompanyProfileFormValues> = {
  goals: [],
  funding_pref: ["non_refundable"],
};

export function OnboardingWizard() {
  const { t, i18n } = useTranslation(["profile", "errors"]);
  const isEnglish = i18n.language === "en";
  const navigate = useNavigate();
  const meta = useMetaQuery();
  const { profile, saveProfile, loadDemo, isSaving, saveError } = useCompanyProfile();
  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex];

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: { ...DEFAULT_VALUES, ...profile },
  });
  const { control, register, handleSubmit, trigger, watch, setValue, formState } = form;
  const errors = formState.errors;

  const regions = meta.data?.reference.regions ?? [];
  const industries = meta.data?.reference.industries ?? [];
  const goals = meta.data?.reference.goals ?? [];
  const revBands = meta.data?.reference.revBands ?? [];
  const orgTypes = meta.data?.reference.orgTypes ?? [];

  const employees = watch("employees");
  const region = watch("region");

  async function goNext() {
    if (step === "intro") {
      setStepIndex(1);
      return;
    }
    const valid = await trigger(STEP_FIELDS[step as keyof typeof STEP_FIELDS]);
    if (!valid) return;
    if (stepIndex === STEPS.length - 1) {
      await handleSubmit(onFinish)();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function onFinish(values: CompanyProfileFormValues) {
    const initials = (values.company || "C")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    await saveProfile({ ...values, initials, country: "HU" });
    navigate("/app");
  }

  async function handleLoadDemo() {
    const demo = await loadDemo();
    form.reset({ ...DEFAULT_VALUES, ...demo });
    setStepIndex(1);
  }

  const progressPct = Math.round((stepIndex / (STEPS.length - 1)) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-paper p-6">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-ink">HUNTER</span>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              {t("profile:actions.exit")}
            </Button>
          </div>
        </div>

        <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full bg-gold transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mb-4 text-xs text-muted">
          {t("profile:progress")} · {stepIndex + 1}/{STEPS.length}
        </p>

        <Panel>
          <h1 className="font-display text-xl font-semibold text-text">{t(`profile:steps.${step}.title`)}</h1>
          <p className="mt-1 text-sm text-muted">{t(`profile:steps.${step}.subtitle`)}</p>

          <div className="mt-5">
            {step === "intro" && (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-md bg-gold-bg p-3 text-sm text-gold-deep"
                  dangerouslySetInnerHTML={{ __html: t("profile:demoBanner") }}
                />
                <div className="flex flex-wrap gap-3">
                  <Button variant="dark" onClick={handleLoadDemo} disabled={isSaving}>
                    {t("profile:actions.loadDemo")}
                  </Button>
                  <Button variant="ghost" onClick={() => setStepIndex(1)}>
                    {t("profile:actions.fillMyself")}
                  </Button>
                </div>
              </div>
            )}

            {step === "company" && (
              <div className="flex flex-col gap-4">
                <TextField label={t("profile:fields.company")} {...register("company")} error={errors.company && t(errors.company.message as string)} />
                <TextField
                  label={t("profile:fields.employees")}
                  type="number"
                  {...register("employees", { valueAsNumber: true })}
                  error={errors.employees && t(errors.employees.message as string)}
                />
                <Controller
                  control={control}
                  name="county"
                  render={({ field }) => (
                    <SelectField
                      label={t("profile:fields.county")}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setValue("region", regionForCounty(e.target.value, regions));
                      }}
                      error={errors.county && t(errors.county.message as string)}
                    >
                      <option value="">{t("profile:fields.county")}</option>
                      {regions.map((r) =>
                        r.counties.map((c) => (
                          <option key={c} value={c}>
                            {c}
                            {r.code !== "HU11" ? ` — ${r.name}` : ""}
                          </option>
                        )),
                      )}
                    </SelectField>
                  )}
                />
                {region ? (
                  <p className="text-xs text-muted">
                    {t("profile:fields.regionCode")}: {region} · {regions.find((r) => r.code === region)?.name}
                  </p>
                ) : null}

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-text">{t("profile:fields.closedYears")}</span>
                  <Controller
                    control={control}
                    name="closed_business_years"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {CLOSED_YEARS_OPTIONS.map((v) => (
                          <ChipButton key={v} selected={field.value === v} onClick={() => field.onChange(v)}>
                            {t(`profile:closedYearsOptions.${v === 0 ? "none" : v === 1 ? "one" : "twoOrMore"}`)}
                          </ChipButton>
                        ))}
                      </div>
                    )}
                  />
                  {errors.closed_business_years ? (
                    <p role="alert" className="mt-1 text-xs text-red">
                      {t(errors.closed_business_years.message as string)}
                    </p>
                  ) : null}
                </div>

                <SelectField label={t("profile:fields.revBand")} labelHint={t("profile:fields.optional")} {...register("revBand")}>
                  <option value="">{t("profile:fields.revBand")}</option>
                  {revBands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </SelectField>
              </div>
            )}

            {step === "activity" && (
              <div>
                <span className="mb-1.5 block text-sm font-medium text-text">{t("profile:fields.industry")}</span>
                <Controller
                  control={control}
                  name="industryId"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {industries.map((ind) => (
                        <ChipButton
                          key={ind.id}
                          selected={field.value === ind.id}
                          onClick={() => {
                            field.onChange(ind.id);
                            setValue("teaor", ind.teaor);
                          }}
                        >
                          {t(`profile:industries.${ind.id}`, { defaultValue: ind.label })}
                        </ChipButton>
                      ))}
                    </div>
                  )}
                />
                {errors.industryId ? (
                  <p role="alert" className="mt-1 text-xs text-red">
                    {t(errors.industryId.message as string)}
                  </p>
                ) : null}
              </div>
            )}

            {step === "goals" && (
              <Controller
                control={control}
                name="goals"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {goals.map((g) => {
                      const selected = field.value.includes(g.id);
                      return (
                        <ChipButton
                          key={g.id}
                          selected={selected}
                          onClick={() =>
                            field.onChange(selected ? field.value.filter((x) => x !== g.id) : [...field.value, g.id])
                          }
                        >
                          {isEnglish ? g.label_en || g.label : g.label}
                        </ChipButton>
                      );
                    })}
                  </div>
                )}
              />
            )}

            {step === "investment" && (
              <div className="flex flex-col gap-4">
                <TextField label={t("profile:fields.projectName")} {...register("projectName")} />
                <TextField
                  label={t("profile:fields.investmentValue")}
                  type="number"
                  {...register("investment_value", { valueAsNumber: true })}
                  error={errors.investment_value && t(errors.investment_value.message as string)}
                />
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-text">{t("profile:fields.fundingPref")}</span>
                  <Controller
                    control={control}
                    name="funding_pref"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {FUNDING_PREF_KEYS.map((key) => {
                          const selected = field.value.includes(key);
                          return (
                            <ChipButton
                              key={key}
                              selected={selected}
                              onClick={() =>
                                field.onChange(
                                  selected ? field.value.filter((x) => x !== key) : [...field.value, key],
                                )
                              }
                            >
                              {t(`profile:fundingPrefOptions.${key}`)}
                            </ChipButton>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            {step === "setup" && (
              <div className="flex flex-col gap-5">
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-text">{t("profile:fields.orgType")}</span>
                  <Controller
                    control={control}
                    name="orgType"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {orgTypes.map((o) => (
                          <ChipButton key={o.id} selected={field.value === o.id} onClick={() => field.onChange(o.id)}>
                            {isEnglish ? o.label_en : o.label_hu}
                          </ChipButton>
                        ))}
                      </div>
                    )}
                  />
                  {employees > 0 ? (
                    <p className="mt-1.5 text-xs text-muted">
                      {t(employees <= 249 ? "profile:orgTypeHintSme" : "profile:orgTypeHintLarge", { count: employees })}
                    </p>
                  ) : null}
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-text">{t("profile:fields.consortiumReady")}</span>
                  <Controller
                    control={control}
                    name="consortium_ready"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        <ChipButton selected={field.value === true} onClick={() => field.onChange(true)}>
                          {t("profile:haveOrCanBuildPartners")}
                        </ChipButton>
                        <ChipButton selected={field.value === false} onClick={() => field.onChange(false)}>
                          {t("profile:onlyAlone")}
                        </ChipButton>
                      </div>
                    )}
                  />
                  <p className="mt-1.5 text-xs text-muted">{t("profile:consortiumHint")}</p>
                  {errors.consortium_ready ? (
                    <p role="alert" className="mt-1 text-xs text-red">
                      {t(errors.consortium_ready.message as string)}
                    </p>
                  ) : null}
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-text">{t("profile:fields.euExperience")}</span>
                  <Controller
                    control={control}
                    name="eu_experience"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        <ChipButton selected={field.value === true} onClick={() => field.onChange(true)}>
                          {t("profile:yes")}
                        </ChipButton>
                        <ChipButton selected={field.value === false} onClick={() => field.onChange(false)}>
                          {t("profile:notYet")}
                        </ChipButton>
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {saveError ? (
            <p role="alert" className="mt-4 text-sm text-red">
              {t("profile:toasts.saveFailed")}
            </p>
          ) : null}

          {step !== "intro" ? (
            <div className="mt-6 flex gap-3">
              {stepIndex > 0 ? (
                <Button variant="ghost" onClick={goBack}>
                  {t("profile:actions.back")}
                </Button>
              ) : null}
              <Button variant="gold" className="flex-1" onClick={goNext} disabled={isSaving}>
                {isSaving ? t("profile:actions.saving") : stepIndex === STEPS.length - 1 ? t("profile:actions.finish") : t("profile:actions.next")}
              </Button>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
