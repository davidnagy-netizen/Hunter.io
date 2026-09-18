# HUNTER — Project Overview

**AI-powered grant and funding intelligence for Hungarian SMEs**

> *"Ne te keresd a pályázatot. A Hunter megtalálja neked."*
> ("Don't go looking for grants. Hunter finds them for you.")

| | |
|---|---|
| **Product stage** | Working MVP prototype (front-end, clickable, end-to-end) |
| **Company** | Aetherpontis |
| **Market** | Hungarian small and medium-sized enterprises (SMEs) |
| **Live demo** | `https://davidnagy-netizen.github.io/Hunter.io/` |
| **Deliverable** | Single self-contained HTML file (~204 KB) |
| **Interface language** | Bilingual — Hungarian / English (runtime toggle) |
| **Target price point** | 5 990 HUF / month |

---

## 1. The problem

Hungarian SMEs have access to substantial non-repayable funding — a single successful application can be worth 5–50 million HUF. Yet most companies never apply, for three reasons:

1. **Volume without relevance.** Public portals list hundreds of open calls. A company has no efficient way to tell which of them it could actually win.
2. **Eligibility is genuinely hard to read.** Rules combine headcount bands, TEÁOR activity codes, regional restrictions, closed business years, project size floors and ceilings, own-contribution requirements and de minimis ceilings. Misreading any one of them wastes weeks.
3. **Deadlines are invisible.** Calls open and close on their own schedule, and staged evaluation can exhaust the budget before the formal deadline.

The result is a market where the money exists but the decision-making layer does not.

## 2. The product

Hunter is **not a grant list**. It is a personalized funding-intelligence layer.

The company builds a structured profile once. From then on, Hunter continuously answers four questions for every open call:

| Question | How Hunter answers it |
|---|---|
| *Am I eligible?* | Deterministic rule engine, with one of four explicit verdicts |
| *Is it worth it?* | Hunter Score (0–100) from five weighted factors |
| *Why?* | Itemized justification using the company's own concrete values |
| *What now?* | Grant calculator, document checklist, deadline calendar |

### The core differentiator

Traditional grant monitors say *"there are 549 open calls."* Hunter says *"these 3 fit your company — and here is why, plus what we ruled out and on what grounds."*

The MVP demonstrates this with a fully worked example on the landing page, using the demo company's real numbers:

- **The company:** 28-employee manufacturing SME, Pest county, digitalization goal, 30M HUF planned investment
- **Hunter's output:** 3 ranked matches (Széchenyi 95, GINOP 87, DIMOP 87) with support ranges, calculated own-contribution and deadlines
- **What was filtered out, with reasons:** TOP Plusz (Pest county not an eligible location), KAP (not an agricultural primary activity), EIC Accelerator (30M HUF project below the 50M HUF floor)

---

## 3. What is built

The MVP implements the complete core user loop as a working prototype. Every screen is interactive; the scoring and eligibility logic is real code, not mockup imagery.

### 3.1 Public landing page

- Hero section built around the product's *actual output* — a real matched-opportunity card with a Hunter Score and itemized reasons — overlaid on a genuine corporate photograph
- The worked comparison example described above
- Three-step "how it works" explanation
- Official primary-source attribution (EU Funding & Tenders, palyazat.gov.hu, kap.gov.hu, Széchenyi Terv Plusz)
- Pricing teaser framing the monthly fee against available funding

### 3.2 Free funding assessment (top-of-funnel)

A 6-question, no-registration flow producing a **Hunter Readiness Score** (0–100) and 3 teaser matches — the first visible, the rest blurred behind the trial. This is the lead-generation entry point in the customer journey.

### 3.3 Onboarding wizard — Company Funding Profile

Five steps: intro (with one-click demo-company loading), company fundamentals, activity/TEÁOR classification, development goals, planned investment. Captures the structured profile that drives all downstream matching.

### 3.4 Application shell

| Screen | Contents |
|---|---|
| **Dashboard** | Summary statistics, ranked opportunity cards (≥70 by default, toggle for lower relevance), upcoming deadlines |
| **Opportunities** | Full ranked list, plus a separate "not eligible" section showing what the rule engine excluded and why |
| **Funding Calendar** | Deadlines grouped by month, with urgency flagging |
| **Favorites** | Saved opportunities |
| **Hunter Plus** | Locked upsell section for the AI application-writing workspace |

### 3.5 Opportunity detail — the heart of the product

- Animated Hunter Score ring with band label
- **Five-factor score breakdown**, each row expandable into its specific justification
- **"Miért ajánljuk?" (Why we recommend this)** — grouped into what passes (✅), what to watch (⚠️) and what is still unknown (❓), every line citing the company's concrete value and the official call reference
- **Inline resolution of missing data:** unknown fields present a question; answering it updates the profile and recalculates the Hunter Score immediately
- **Grant calculator** with live own-contribution recalculation, capped at the call's funding ceiling
- Required-documents checklist and source attribution

---

## 4. Core algorithms

Both engines are implemented faithfully to the product specification. This is the substance of the product, and it is real working code in the MVP.

### 4.1 Eligibility Engine (deterministic)

Rule-based and fully deterministic. The critical architectural principle: **the engine filters, the AI ranks and explains — the AI can never override an eligibility verdict.**

Rules are declarative objects of the form `{field, op, value}`, supporting seven operators:

```
between   in   not_in   >=   <=   ==   includes_any
```

Fields evaluated include: `employees`, `teaor`, `region`, `closed_business_years`, `investment_value`, `de_minimis_ok`, `goals`.

The engine emits exactly one of four verdicts:

| Verdict | Meaning |
|---|---|
| `ELIGIBLE` | All hard rules pass, no material conditions |
| `CONDITIONAL` | All hard rules pass, but conditions apply (own contribution, near deadline, high administrative burden) |
| `INSUFFICIENT_DATA` | At least one required field is unknown — the user is asked, rather than the system guessing |
| `NOT_ELIGIBLE` | At least one hard rule fails; the call is excluded and no score is shown |

The `INSUFFICIENT_DATA` → *ask the user* → *update profile* → *recalculate* loop is fully wired in the MVP.

### 4.2 Hunter Score (five weighted factors)

```
Hunter Score = 0.35 · Eligibility
             + 0.25 · ProjectFit
             + 0.15 · FundingSize
             + 0.15 · Timing
             + 0.10 · Feasibility
```

Each factor is computed by its own function:

| Factor | Weight | Basis |
|---|---|---|
| **Eligibility** | 35% | Proportion of hard rules passing (unknowns partially credited) |
| **ProjectFit** | 25% | Overlap between call objectives and company goals, plus weighted soft rules |
| **FundingSize** | 15% | Project value against the call's funding band, and whether resulting support is material |
| **Timing** | 15% | Days remaining to deadline, banded |
| **Feasibility** | 10% | Own-contribution burden, document count, administrative complexity |

**Score bands:**

| Range | Band |
|---|---|
| 85–100 | Very strong opportunity |
| 70–84 | Relevant opportunity |
| 50–69 | Conditional opportunity |
| 0–49 | Low relevance (hidden by default) |

The dashboard surfaces ≥70 by default. `NOT_ELIGIBLE` calls receive no score at all; `INSUFFICIENT_DATA` calls show an estimated score, explicitly labelled as such.

### 4.3 Verified engine behaviour

The engine was tested against the demo profile (28 employees, Pest county, TEÁOR 28 manufacturing, 30M HUF) and produces exactly the specified outcomes:

| Call | Result |
|---|---|
| Széchenyi Terv Plusz — technology procurement | Score 95, `CONDITIONAL` |
| GINOP Plusz — digitalization | Score 87, `INSUFFICIENT_DATA` (de minimis unknown) |
| DIMOP Plusz — AI and software | Score 87, `CONDITIONAL` |
| TOP Plusz — site development | `NOT_ELIGIBLE` — Pest county excluded by region rule |
| KAP — agricultural holdings | `NOT_ELIGIBLE` — TEÁOR gate requires agricultural activity |

Answering the de minimis question resolves the GINOP entry live: *yes* → score rises to 89; *no* → the call becomes `NOT_ELIGIBLE`. This confirms the ask-and-recalculate loop end to end.

---

## 5. Data

The MVP ships with **9 realistic mock Hungarian funding calls**, each carrying full hard-rule and soft-rule definitions, funding bands, support intensity, deadline, required documents and an official source reference:

`ginop-dig` · `kehop-energy` · `dimop-ai` · `szechenyi-tech` · `top-site` · `kap-agri` · `ginop-training` · `eic` · `vinop-rnd`

Supporting reference data: **9 NUTS-2 regions** with county mapping, **8 industry categories** with TEÁOR classes, **20 development goals**, and revenue bands.

These are hand-authored demonstration entries, deliberately chosen to exercise every engine path — including two calls that the rule engine must reject for the demo company, and one with a deliberately unknown field.

---

## 6. Technical architecture

### Current implementation

| Aspect | Choice |
|---|---|
| **Format** | Single self-contained HTML file |
| **Stack** | Vanilla HTML / CSS / JavaScript — no frameworks |
| **External dependencies** | Google Fonts only |
| **State** | In-memory JavaScript object, re-rendered per view |
| **Persistence** | None (no browser storage) |
| **Code size** | ~204 KB total, 86 JavaScript functions |
| **Assets** | Corporate photograph embedded as base64 (web-optimized, 52 KB) |

The single-file choice is deliberate for the prototype stage: maximum portability, instant deployment to any static host, no build step, no install, and trivially shareable with prospects.

### Design system

| Element | Value |
|---|---|
| **Display / numerals** | Space Grotesk |
| **Body / UI** | Inter |
| **Ink (dark surfaces)** | `#0E1726` |
| **Brand accent** | `#D99A2B` (gold — the hunter / target / value metaphor) |
| **Semantic: eligible** | `#199268` green |
| **Semantic: conditional** | `#DD8331` amber |
| **Semantic: not eligible** | `#CA4A4A` red |
| **Semantic: unknown** | `#8A94A6` slate |

Both typefaces carry full Hungarian diacritic support — a hard requirement given the interface language.

### Bilingual support (HU / EN)

The interface runs fully in Hungarian and English, switchable at runtime from a toggle present on the landing page, in both funnel flows and in the application shell (floating top-right on mobile, where the sidebar is hidden).

The implementation uses a single central dictionary (`TR`) mapping Hungarian source strings to English, applied through a helper `L()`. The important architectural detail: **translation happens at render time, never at data-definition time.** Grant titles, rule labels, document names and programme names stay in Hungarian in the data layer and are translated as they are drawn, so switching language mid-session re-translates everything — including an already-open opportunity detail page — without reloading or losing state.

Interpolated strings (those embedding live values, such as *"28 days until the submission deadline"*) use a second helper `LX(hu, en)` that carries both variants inline.

Locale-aware formatting switches with the language:

| | Hungarian | English |
|---|---|---|
| Currency | `30 M Ft`, `1,5 Mrd Ft` | `30M HUF`, `1.5 bn HUF` |
| Dates | `2027.01.31.` | `31 Jan 2027` |
| Month names | `január` | `January` |
| `<html lang>` | `hu` | `en` |

Hungarian proper nouns are deliberately preserved in both languages (for example *Széchenyi*, county names), since these are official programme and place names. Adding a third language means extending one dictionary rather than touching the views.

### Motion and animation

- Branded matching-engine loader with a stepped checklist reflecting the actual pipeline (profile normalization → eligibility engine → Hunter Score → ranking)
- Scroll-reveal entrance animations on the landing sections via `IntersectionObserver`
- Hunter Score rings animate from zero to their computed value
- Staggered card entrance on first dashboard load

All motion respects `prefers-reduced-motion`; with reduced motion enabled, content appears immediately and in full.

### Responsive behaviour

Mobile-first, verified at **300, 320, 360 and 390 px** widths across every screen with zero horizontal overflow. Layout adapts from a sidebar rail on desktop to a fixed bottom navigation bar on mobile, with safe-area insets honoured.

---

## 7. Deployment

Hosted free on **GitHub Pages** from a public repository containing a single `index.html`. Deployment is a file upload; there is no build pipeline.

**To update the live site:** upload the new `index.html` to the repository root (*Add file → Upload files → Commit changes*). GitHub Pages rebuilds within 1–2 minutes. Append a cache-busting query string (e.g. `?v=2`) when verifying on mobile, since browsers aggressively cache the page.

**Netlify Drop** is a viable alternative offering the same drag-and-drop simplicity; note that sites deployed without an account are password-protected until claimed and are deleted after 24 hours.

---

## 8. Scope boundaries

Being explicit about what this MVP does and does not do is important when demonstrating it.

### Genuinely working

- The deterministic eligibility engine, with all four verdicts and seven rule operators
- The exact five-factor Hunter Score formula and its bands
- The full explainability layer, driven by the company's own data
- The ask-and-recalculate loop for unknown fields
- The grant calculator, funding calendar, favorites and ranking
- The complete navigable user journey from landing page to opportunity detail

### Not yet implemented (requires backend work)

| Missing capability | Note |
|---|---|
| **Live data connectors** | EU Funding & Tenders API, palyazat.gov.hu, kap.gov.hu. Currently 9 hand-authored mock calls. |
| **Accounts and billing** | No registration, authentication, trial enforcement or payment |
| **Persistence** | Profile and favorites reset on reload |
| **Notifications** | Smart alerts at 30/14/7/3 days, email delivery, `.ics` calendar export |
| **Hunter Plus** | The AI application-writing workspace — entry point and upsell flow are visible, functionality is not built |

---

## 9. Roadmap

### Immediate next steps

1. **First real connector.** Wire the EU Funding & Tenders API behind a thin backend, replacing mock entries with live calls. This is the single highest-value step — it converts a convincing demo into a usable product.
2. **Persistence and accounts.** A minimal backend for company profiles, saved opportunities and the 5-day trial.
3. **Branding pass.** Replace the placeholder logo mark with final brand assets.

### Phase 2

- Hungarian source connectors (palyazat.gov.hu, kap.gov.hu) with source-reliability tracking
- Smart alerts and deadline notification delivery
- Hunter Plus: project workspace, requirement extraction from call documents, targeted AI questions, chapter-by-chapter application drafting
- Productized funding assessment as a standalone lead magnet
- Retention loop and proof engine

---

## 10. Key product principles

These emerged during the build and should govern future work.

**Concrete beats abstract.** The comparison section became persuasive only when it used the demo company's actual numbers and named the specific calls that were excluded, with reasons. Abstract value claims consistently underperformed worked examples.

**The engine filters; the AI explains.** Eligibility must never be an AI judgement call. Determinism is what makes the output trustworthy, and trustworthiness is the product.

**Never guess — ask.** When a required field is unknown, the correct behaviour is to surface the question, not to assume a value. The `INSUFFICIENT_DATA` verdict exists precisely so the system can be honest about its own gaps.

**Cite the source, always.** Every claim references the official call and its version. The interface says "based on the call, your company matches the criteria" rather than "you are eligible" — a filtering aid, never an authoritative determination.
