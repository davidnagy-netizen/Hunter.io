/**
 * Hungarian national reference calls.
 *
 * Hand-authored entries that mirror the shape of real Hungarian programmes.
 * They flow through the same pipeline and the same rule engine as the scraped
 * EU calls, which is what a real national connector would plug into.
 *
 * Every one carries `curated: true`, and only entries with a genuinely
 * verifiable page carry a `sourceUrl`. The national portal
 * (palyazat.gov.hu) was unreachable while these were written, so the interface
 * says a link is unavailable rather than sending anyone to a dead page.
 */
export const OPPS = [
  {
    id: "ginop-dig",
    program: "GINOP Plusz",
    title: "Vállalati digitalizáció (ERP, gyártásvezérlés)",
    goals: ["digitalization", "it", "ai"],
    fundingMin: 5e6,
    fundingMax: 50e6,
    intensity: 0.5,
    deadline: "2026-10-30",
    source: "GINOP_PLUSZ_DIG_felhivas_v1.3",

    sourceUrl: null,

    curated: true,
    isNew: true,
    highAdmin: false,
    docs: [
      "Utolsó lezárt évi beszámoló",
      "Cégkivonat (30 napnál nem régebbi)",
      "2 db független árajánlat",
      "Rövid fejlesztési terv",
    ],
    hard: [
      { field: "employees", op: "between", value: [5, 249], label: "5–249 fős vállalkozásnak szól" },
      { field: "region", op: "not_in", value: ["HU11"], label: "A megvalósítási helyszín nem lehet Budapest" },
      { field: "closed_business_years", op: ">=", value: 2, label: "Legalább 2 lezárt üzleti év szükséges" },
      { field: "teaor", op: "not_in", value: ["01", "02", "03"], label: "Elsődleges mezőgazdasági tevékenység kizárt" },
      { field: "investment_value", op: "between", value: [5e6, 100e6], label: "A projekt mérete 5–100 M Ft között" },
      {
        field: "de_minimis_ok",
        op: "==",
        value: true,
        label: "Szabad de minimis keret szükséges (~300 000 EUR / 3 év)",
        quiz: {
          q: "Van szabad de minimis kereted (kb. 300 000 EUR / 3 év)?",
          opts: [
            { t: "Igen", v: true },
            { t: "Nem", v: false },
            { t: "Nem tudom", v: null },
          ],
        },
      },
    ],
    soft: [
      { field: "goals", op: "includes_any", value: ["digitalization", "it", "ai"], weight: 0.5 },
      { field: "investment_value", op: "between", value: [10e6, 60e6], weight: 0.5 },
    ],
  },
  {
    id: "kehop-energy",
    program: "KEHOP Plusz",
    title: "Vállalati energiahatékonyság és napelem",
    goals: ["energy", "building"],
    fundingMin: 3e6,
    fundingMax: 200e6,
    intensity: 0.45,
    deadline: "2026-09-21",
    source: "KEHOP_PLUSZ_ENERG_felhivas_v2.0",

    sourceUrl: null,

    curated: true,
    isNew: true,
    highAdmin: false,
    docs: ["Energetikai audit / tanúsítvány", "Utolsó lezárt évi beszámoló", "Kivitelezői árajánlat"],
    hard: [
      { field: "employees", op: "between", value: [1, 249], label: "1–249 fős vállalkozásnak szól" },
      { field: "closed_business_years", op: ">=", value: 1, label: "Legalább 1 lezárt üzleti év szükséges" },
      { field: "investment_value", op: "between", value: [3e6, 500e6], label: "A projekt mérete 3–500 M Ft között" },
    ],
    soft: [
      { field: "goals", op: "includes_any", value: ["energy", "building"], weight: 0.6 },
      { field: "investment_value", op: "between", value: [5e6, 150e6], weight: 0.4 },
    ],
  },
  {
    id: "dimop-ai",
    program: "DIMOP Plusz",
    title: "Mesterséges intelligencia és szoftverfejlesztés",
    goals: ["ai", "it", "digitalization"],
    fundingMin: 10e6,
    fundingMax: 75e6,
    intensity: 0.6,
    deadline: "2026-12-15",
    source: "DIMOP_PLUSZ_AI_felhivas_v1.0",

    sourceUrl: null,

    curated: true,
    isNew: true,
    highAdmin: false,
    docs: ["Beszámoló", "Fejlesztési koncepció", "Szakmai önéletrajzok (kulcsemberek)"],
    hard: [
      { field: "employees", op: "between", value: [10, 249], label: "10–249 fős vállalkozásnak szól" },
      { field: "region", op: "not_in", value: ["HU11"], label: "A megvalósítási helyszín nem lehet Budapest" },
      { field: "closed_business_years", op: ">=", value: 2, label: "Legalább 2 lezárt üzleti év szükséges" },
      { field: "investment_value", op: "between", value: [10e6, 150e6], label: "A projekt mérete 10–150 M Ft között" },
    ],
    soft: [
      { field: "goals", op: "includes_any", value: ["ai", "it"], weight: 0.7 },
      { field: "teaor", op: "in", value: ["62", "63"], weight: 0.3 },
    ],
  },
  {
    id: "szechenyi-tech",
    program: "Széchenyi Terv Plusz",
    title: "Technológiai gép- és eszközbeszerzés",
    goals: ["machinery", "digitalization"],
    fundingMin: 10e6,
    fundingMax: 100e6,
    intensity: 0.45,
    deadline: "2027-01-31",
    source: "SZTP_TECH_felhivas_v1.2",

    sourceUrl: null,

    curated: true,
    isNew: false,
    highAdmin: false,
    docs: ["Beszámoló", "2 db gép-árajánlat", "Fejlesztési terv", "Cégkivonat"],
    hard: [
      { field: "employees", op: "between", value: [5, 249], label: "5–249 fős vállalkozásnak szól" },
      { field: "region", op: "not_in", value: ["HU11"], label: "A megvalósítási helyszín nem lehet Budapest" },
      { field: "closed_business_years", op: ">=", value: 2, label: "Legalább 2 lezárt üzleti év szükséges" },
      { field: "investment_value", op: "between", value: [10e6, 200e6], label: "A projekt mérete 10–200 M Ft között" },
    ],
    soft: [
      { field: "goals", op: "includes_any", value: ["machinery"], weight: 0.6 },
      { field: "investment_value", op: "between", value: [20e6, 120e6], weight: 0.4 },
    ],
  },
  {
    id: "top-site",
    program: "TOP Plusz",
    title: "Telephelyfejlesztés és épületenergetika",
    goals: ["building", "energy"],
    fundingMin: 5e6,
    fundingMax: 120e6,
    intensity: 0.55,
    deadline: "2026-11-25",
    source: "TOP_PLUSZ_TELEPHELY_felhivas_v1.1",

    sourceUrl: null,

    curated: true,
    isNew: false,
    highAdmin: false,
    docs: ["Beszámoló", "Építési költségvetés", "Tulajdoni lap"],
    hard: [
      { field: "employees", op: "between", value: [1, 249], label: "1–249 fős vállalkozásnak szól" },
      {
        field: "region",
        op: "in",
        value: ["HU21", "HU22", "HU23", "HU31", "HU32", "HU33"],
        label: "Csak vidéki (nem közép-magyarországi) régió támogatható",
      },
      { field: "investment_value", op: "between", value: [5e6, 150e6], label: "A projekt mérete 5–150 M Ft között" },
    ],
    soft: [{ field: "goals", op: "includes_any", value: ["building", "energy"], weight: 1 }],
  },
  {
    id: "kap-agri",
    program: "KAP",
    title: "Mezőgazdasági üzemek fejlesztése",
    goals: ["agriculture", "machinery"],
    fundingMin: 2e6,
    fundingMax: 150e6,
    intensity: 0.5,
    deadline: "2026-11-10",
    source: "KAP_UZEMFEJLESZTES_felhivas_v3.0",

    sourceUrl: null,

    curated: true,
    isNew: false,
    highAdmin: false,
    docs: ["Beszámoló / SZJA bevallás", "Gazdálkodási napló", "Árajánlatok"],
    hard: [
      { field: "teaor", op: "in", value: ["01", "02", "03"], label: "Mezőgazdasági főtevékenység szükséges" },
      { field: "closed_business_years", op: ">=", value: 1, label: "Legalább 1 lezárt gazdálkodási év" },
      { field: "investment_value", op: "between", value: [2e6, 300e6], label: "A projekt mérete 2–300 M Ft között" },
    ],
    soft: [{ field: "goals", op: "includes_any", value: ["agriculture", "machinery"], weight: 1 }],
  },
  {
    id: "ginop-training",
    program: "GINOP Plusz",
    title: "Munkahelyi képzések támogatása",
    goals: ["training", "employment"],
    fundingMin: 1e6,
    fundingMax: 30e6,
    intensity: 0.7,
    deadline: "2026-09-30",
    source: "GINOP_PLUSZ_KEPZES_felhivas_v1.0",

    sourceUrl: null,

    curated: true,
    isNew: true,
    highAdmin: false,
    docs: ["Beszámoló", "Képzési terv", "Munkavállalói létszámadatok"],
    hard: [
      { field: "employees", op: "between", value: [5, 249], label: "5–249 fős vállalkozásnak szól" },
      { field: "region", op: "not_in", value: ["HU11"], label: "A megvalósítási helyszín nem lehet Budapest" },
      { field: "closed_business_years", op: ">=", value: 1, label: "Legalább 1 lezárt üzleti év szükséges" },
      { field: "investment_value", op: "between", value: [1e6, 50e6], label: "A projekt mérete 1–50 M Ft között" },
    ],
    soft: [{ field: "goals", op: "includes_any", value: ["training", "employment"], weight: 1 }],
  },
  {
    id: "eic",
    program: "EU – Funding & Tenders",
    title: "EIC Accelerator – innováció és skálázás",
    goals: ["rnd", "innovation"],
    fundingMin: 50e6,
    fundingMax: 900e6,
    intensity: 0.7,
    deadline: "2026-10-08",
    source: "EU_EIC_ACCELERATOR_2026_call",

    sourceUrl: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en",

    curated: true,
    isNew: false,
    highAdmin: true,
    docs: ["Angol nyelvű üzleti terv", "Pitch deck", "Pénzügyi kimutatások (3 év)", "Innovációs leírás"],
    hard: [
      { field: "employees", op: "between", value: [1, 249], label: "KKV (max. 249 fő) pályázhat" },
      { field: "closed_business_years", op: ">=", value: 1, label: "Legalább 1 lezárt üzleti év szükséges" },
      {
        field: "investment_value",
        op: "between",
        value: [50e6, 2000e6],
        label: "Nagyléptékű, 50 M Ft feletti innovációs projekt",
      },
    ],
    soft: [{ field: "goals", op: "includes_any", value: ["rnd", "innovation"], weight: 1 }],
  },
  {
    id: "vinop-rnd",
    program: "VINOP Plusz",
    title: "Vállalati K+F+I projektek",
    goals: ["rnd", "innovation"],
    fundingMin: 20e6,
    fundingMax: 200e6,
    intensity: 0.4,
    deadline: "2027-02-28",
    source: "VINOP_PLUSZ_KFI_felhivas_v1.0",

    sourceUrl: null,

    curated: true,
    isNew: false,
    highAdmin: false,
    docs: ["Beszámoló", "K+F terv", "Kutatói kapacitás igazolása"],
    hard: [
      { field: "employees", op: "between", value: [10, 249], label: "10–249 fős vállalkozásnak szól" },
      { field: "region", op: "not_in", value: ["HU11"], label: "A megvalósítási helyszín nem lehet Budapest" },
      { field: "closed_business_years", op: ">=", value: 2, label: "Legalább 2 lezárt üzleti év szükséges" },
      { field: "investment_value", op: "between", value: [20e6, 400e6], label: "A projekt mérete 20–400 M Ft között" },
    ],
    soft: [{ field: "goals", op: "includes_any", value: ["rnd", "innovation"], weight: 1 }],
  },
];
