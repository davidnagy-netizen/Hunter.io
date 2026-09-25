import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { httpClient } from "@/api/httpClient";
import { ChipButton, SelectField, TextField } from "@/components";
import type { CompanyMetrics } from "../types/metrics.types";
import "../i18n";

/** Shared registration/profile editor. Sector selection always stores a KSH code. */
export function CompanyMetricsFields({ value, onChange }: {
  value: Partial<CompanyMetrics>;
  onChange: (value: Partial<CompanyMetrics>) => void;
}) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const id = useId();
  const [query, setQuery] = useState(value.teaor_code ?? "");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 250); return () => clearTimeout(timer); }, [query]);
  const options = useQuery({
    queryKey: ["onboarding-options"],
    queryFn: () => httpClient.get<{ counties: Record<string, string> }>("/v1/onboarding/options").then(r => r.data),
    staleTime: Infinity,
  });
  const sectors = useQuery({
    queryKey: ["sectors", debounced],
    queryFn: ({ signal }) => httpClient.get<{ data: { code: string; label: string }[] }>("/v1/sectors/search", { params: { query: debounced }, signal }).then(r => r.data.data),
    enabled: debounced.trim().length > 0,
  });
  function set<K extends keyof CompanyMetrics>(key: K, field: CompanyMetrics[K]) { onChange({ ...value, [key]: field }); }
  function choose(code: string) { set("teaor_code", code); setQuery(code); setOpen(false); }
  // Same visual contract as TextField/SelectField's own input classes, for the one control
  // (the TEÁOR combobox) that isn't a drop-in fit for either shared component.
  const comboboxClass = "rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-gold";
  const bands = ["< 50M Ft", "50M – < 200M Ft", "200M – < 800M Ft", "800M – < 4 Mrd Ft", "4 – 20 Mrd Ft", "> 20 Mrd Ft"];
  return <div className="flex flex-col gap-4">
    <SelectField label={en ? "Legal form" : "Jogi forma"} value={value.legal_form ?? ""} onChange={e => set("legal_form", e.target.value as CompanyMetrics["legal_form"])} required>
      <option value="">{en ? "Select" : "Válasszon"}</option>
      {Object.entries({ kft: "Kft.", bt: "Bt.", zrt: "Zrt.", nyrt: "Nyrt.", ev: "Egyéni vállalkozó", kkt: "Kkt.", cooperative: "Szövetkezet" }).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
    </SelectField>
    <TextField label={en ? "Headcount" : "Létszám"} type="number" min="0" step="1" value={value.headcount ?? ""} onChange={e => set("headcount", e.target.valueAsNumber)} required
      labelHint="0 · 1–9 · 10–49 · 50–249 · 250+" />
    <SelectField label={en ? "Closed business years" : "Lezárt üzleti évek"} value={value.closed_business_years === undefined ? "" : Math.min(value.closed_business_years, 3)} onChange={e => set("closed_business_years", Number(e.target.value))} required>
      <option value="">{en ? "Select" : "Válasszon"}</option>
      {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v === 3 ? "3+" : v}</option>)}
    </SelectField>
    <div>
      <SelectField label={en ? "County of operation" : "Működés vármegyéje"} value={value.county_code ?? ""} onChange={e => set("county_code", e.target.value)} required>
        <option value="">{en ? "Select" : "Válasszon"}</option>
        {Object.entries(options.data?.counties ?? {}).map(([code, label]) => <option key={code} value={code}>{label}{["01", "13"].includes(code) ? " — Közép-Magyarország" : ""}</option>)}
      </SelectField>
      <p className="mt-1.5 text-xs text-muted">{en ? "Regional restrictions depend on each funding call." : "A területi korlátozások pályázatonként eltérnek."}</p>
    </div>
    {options.isError && <p role="alert" className="text-xs text-red">{en ? "Could not load counties." : "A vármegyék nem tölthetők be."}</p>}
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">{en ? "Sector (TEÁOR’25)" : "Tevékenység (TEÁOR’25)"}</label>
      <input id={id} className={comboboxClass} role="combobox" aria-autocomplete="list" aria-expanded={open}
        aria-controls={id + "-list"} aria-activedescendant={open && sectors.data?.[active] ? id + "-" + active : undefined}
        value={query} onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); set("teaor_code", ""); setOpen(true); setActive(0); }}
        onKeyDown={e => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive(v => Math.min(v + 1, (sectors.data?.length ?? 1) - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive(v => Math.max(0, v - 1)); }
          if (e.key === "Enter" && open && sectors.data?.[active]) { e.preventDefault(); choose(sectors.data[active].code); }
        }} />
      {open && <ul id={id + "-list"} role="listbox" className="rounded-md border border-line-strong bg-white py-1 shadow-card">
        {sectors.data?.map((sector, index) => <li key={sector.code} id={id + "-" + index} role="option" aria-selected={index === active}
          onMouseDown={e => e.preventDefault()} onClick={() => choose(sector.code)} className="cursor-pointer px-3 py-2 text-sm text-text hover:bg-gold-bg">{sector.code} — {sector.label}</li>)}
      </ul>}
      {sectors.isFetching && <p role="status" className="text-xs text-muted">{en ? "Searching…" : "Keresés…"}</p>}
      {sectors.isError && <p role="alert" className="text-xs text-red">{en ? "Sector search unavailable." : "A tevékenységkereső nem érhető el."}</p>}
      {value.teaor_code && <p className="text-xs text-muted">{en ? "Selected" : "Kiválasztva"}: {value.teaor_code}</p>}
    </div>
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-text">{en ? "Annual net revenue band" : "Éves nettó árbevétel sávja"}</legend>
      <div className="flex flex-wrap gap-2">{bands.map((label, index) => (
        <ChipButton key={label} type="button" selected={value.revenue_band === index + 1} onClick={() => set("revenue_band", index + 1)}>{label}</ChipButton>
      ))}</div>
    </fieldset>
    <label className="flex items-center gap-2 text-sm text-text">
      <input type="checkbox" className="accent-gold" checked={value.exact_revenue != null} onChange={e => set("exact_revenue", e.target.checked ? "" : null)} />
      {en ? "Enter exact net revenue (optional)" : "Adja meg a pontos nettó árbevételt (opcionális)"}
    </label>
    {value.exact_revenue != null && <TextField label={en ? "Exact revenue (HUF)" : "Pontos árbevétel (Ft)"} inputMode="decimal" value={value.exact_revenue} onChange={e => set("exact_revenue", e.target.value.replace(",", "."))} />}
  </div>;
}
