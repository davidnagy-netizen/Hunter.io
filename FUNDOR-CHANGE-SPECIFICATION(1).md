# Fundor — Change Specification v0.2

**Product:** Fundor (formerly HUNTER) — funding intelligence platform for Hungarian SMEs
**Document type:** Change request / requirements specification
**Status:** Approved in part — naming and domain decided (see Decision Log); CR-02 remains blocked pending legal opinion
**Version:** v0.2
**Date:** 18 September 2026

### Decision log

| # | Decision | Date | Effect |
|---|---|---|---|
| D-01 | `fundor.hu` is **secured and available**. It becomes the primary domain. | 18 Sep 2026 | CR-01 unblocked |
| D-02 | The premium tier is named **Fundor Plus** (not "Pro"). | 18 Sep 2026 | Supersedes the "Pro subscription" wording in the original notes; applies throughout CR-02 |

---

## 1. Purpose

This document formalizes the requested adjustments to the HUNTER MVP. It restates each request as a defined change, assesses feasibility and risk, and flags the decisions needed before implementation can start.

Three change requests are covered:

| ID | Change | Priority | Blocking issues |
|---|---|---|---|
| **CR-01** | Rebrand to Fundor.hu | High | Domain secured (D-01); trademark clearance outstanding |
| **CR-02** | Ingest Kavosz / Széchenyi Card Programme loan products; gate behind Fundor Plus | High | **Regulatory — see §3.5** |
| **CR-03** | GDPR-compliant registration flow with company lookup, revenue banding and sector | High | Data source selection; field list incomplete |

---

## 2. CR-01 — Rebrand to Fundor.hu

### Requirement
The product is renamed from HUNTER to **Fundor**, with `fundor.hu` as the primary domain.

### Scope of work
- Wordmark, logo and favicon replacement
- All interface copy in both languages (the product name appears in the central `TR` translation dictionary, the page `<title>`, the loader, and the footer)
- Scoring nomenclature: "Hunter Score" and "Hunter Readiness Score" must be renamed (proposed: **Fundor Score**, **Fundor Readiness Score**) — this affects both language variants
- "Hunter Plus" premium tier is renamed **Fundor Plus** (D-02). The original notes referred to a "Pro subscription"; that wording is superseded — **Plus** is the single name used in the product, in pricing and in all copy
- Repository, hosting and deployment target; redirect from any previously shared link
- Email sender domain, privacy notice and terms of service references

### Settled
- **Domain:** `fundor.hu` is available and secured (D-01).
- **Premium tier:** **Fundor Plus** (D-02).

### Still outstanding
1. **Trademark clearance.** Run a search at HIPO (Hungarian Intellectual Property Office) and EUIPO before the name appears in public-facing material. "Fundor" sits close to several existing fintech marks; owning the domain is not the same as owning the right to trade under the name. This should be cleared, not assumed.
2. **Defensive registrations.** Secure `fundor.com` where obtainable, plus the obvious misspellings and the `.eu` variant, before announcing the name.
3. **Naming consistency sweep.** The build currently contains "Hunter Plus" in the interface, in the `TR` dictionary and in the upgrade modal; all must move to "Fundor Plus" in both languages in a single pass.

---

## 3. CR-02 — Kavosz / Széchenyi Card Programme loan products

### Requirement as stated
> "Pull as much as possible from `https://www.kavosz.hu/hitelek/`. Include this in the Plus subscription."

*(The original note said "Pro"; per D-02 the tier is **Fundor Plus**.)*

### What this data actually is
The Széchenyi Card Programme is coordinated by KAVOSZ Zrt. <cite index="9-2">It is operated by KAVOSZ Zrt. and delivered through several commercial banks, and is primarily available to SMEs with at least one closed business year.</cite> <cite index="9-3">The programme offers current-account credit, investment loans, working-capital loans, liquidity loans and leasing, with terms up to ten years for investment loans, simplified assessment, and state-subsidised interest.</cite>

### Critical product implication — this is not grant data

**This is the single most important point in this document.** Every product asset built so far assumes *non-repayable grants*:

- The **Eligibility Engine** evaluates grant call criteria
- The **Score** weights a `FundingSize` factor that treats the award as money received
- The interface calculates "expected funding" and "required own contribution"
- The comparison section promises "5–50M HUF in non-repayable funding"

A subsidised loan is **debt**. The benefit is not the loan amount — it is the interest subsidy and the eased access. Presenting a 100M HUF loan next to a 20M HUF grant, ranked by the same score, is actively misleading to the user and damages the product's core credibility claim.

**Recommendation:** introduce an explicit instrument type on every funding record:

```
instrument_type: "grant" | "subsidised_loan" | "guarantee" | "combined"
```

and adapt accordingly:
- Score factors must be computed per instrument type (for loans, model *cost of capital saved* rather than *amount awarded*)
- The interface must visually separate and clearly label loans versus grants — never blend them into one undifferentiated ranked list
- The calculator needs a loan mode: interest rate, term, grace period, repayment, total cost, subsidy value

### Data freshness requirement
Programme terms change frequently and materially. <cite index="8-1">The Ministry for Economy and Energy modified the interest conditions of the programme's liquidity loan products, with the stated aim of making the programme more sustainable.</cite> <cite index="4-1">Interest terms for several constructions changed with effect from 15 July 2026.</cite>

Consequently every loan record must carry an effective-from date, a source document reference and a version, exactly as grant calls already do. Stale interest rates displayed as current are a legal and reputational exposure, not merely a data-quality issue.

### ⚠️ Regulatory blocker — credit intermediation

Presenting, comparing and recommending specific credit products to businesses may constitute **credit intermediation**, which is a licensed and supervised activity in Hungary (MNB — the National Bank of Hungary). Passing qualified leads to banks or to KAVOSZ for consideration would strengthen that characterisation.

**This must be cleared with a financial-regulatory lawyer before the feature ships.** Practical mitigations to discuss with counsel:

- Position the feature strictly as *information*, not advice or recommendation: no "you should take this loan", no personalised ranking that reads as a recommendation
- Display mandatory disclaimers and always link to the official, binding programme documentation (the Business Rules — *Üzletszabályzat*)
- Avoid lead-generation and commission arrangements until licensing is resolved
- Alternatively, pursue a formal partnership or licensed-intermediary arrangement with KAVOSZ

This risk does not exist for grant information, which is why it has not arisen until now.

### ⚠️ Scraping is the wrong acquisition method

"Pull as much as possible" implies scraping. Three objections:

1. **Terms of use.** `kavosz.hu` content is copyrighted; automated extraction likely breaches its terms. This must be checked, not assumed.
2. **Accuracy.** Marketing pages are not the binding source. The authoritative source is the Business Rules documentation. <cite index="3-1">The programme's Business Rules, issued with the approval of the Ministry for Economy and Energy, together with its constituent regulations, are available on kavosz.hu.</cite> Product terms should be derived from those documents.
3. **Fragility.** A scraper breaks silently on redesign, and silent failure on financial terms is the worst possible failure mode.

**Recommendation:** approach KAVOSZ directly for a data-sharing or partnership arrangement. Until that exists, maintain a small curated dataset sourced from the official Business Rules, with named human review and a visible "last verified" date on every record.

### Fundor Plus gating
Placing loan products behind the Fundor Plus subscription is commercially sound — it is a distinct, high-value data set. Two conditions:

- Free users should still see that loan options *exist* for their profile (count and category), so the upgrade prompt is grounded in something real
- Mandatory legal disclaimers must never sit behind a paywall

---

## 4. CR-03 — Registration flow

### Requirement as stated
> Registration steps, GDPR-compliant: exact company name; tax number — the system should look the company up via ceginformacio.hu; a banding system based on net annual revenue; sector.

### 4.1 Assessment of each field

| Field | Verdict | Notes |
|---|---|---|
| Exact company name | ✅ Correct | Should be **auto-filled from an official source**, not typed by the user — free text produces unreliable matching |
| Tax number | ✅ Correct — make it the primary key | Validate the check digit client-side before any lookup |
| Company lookup by tax number | ✅ Correct concept, ❌ wrong source | See §4.2 |
| Revenue banding | ⚠️ Correct for UX, risky for eligibility | See §4.3 |
| Sector | ⚠️ Underspecified | Must be a TEÁOR code, not a free-text or custom sector list — see §4.4 |
| GDPR compliance | ✅ Correct instinct, needs substance | See §4.5 |

### 4.2 Company lookup — replace ceginformacio.hu

`ceginformacio.hu` is a **commercial information provider**, not an official register. Scraping it would breach its terms and expose the company to a claim. Use official sources instead:

| Need | Recommended source | Cost | Notes |
|---|---|---|---|
| Validate tax number, retrieve official name and address | **NAV Online Invoice API — `queryTaxpayer`** | Free | Official, well-documented; <cite index="16-1">returns taxpayer name, short name, tax number detail, VAT group membership and address list</cite>. Requires a NAV technical-user registration. |
| Company register data (registration number, legal form, status) | e-cégjegyzék / Company Information Service | Partly free | Per-query limits apply |
| Net annual revenue, headcount, closed business years | **e-beszamolo.im.gov.hu** (published financial statements) | Free to view | <cite index="19-1">Free inspection of filed statements is provided on e-beszamolo.im.gov.hu</cite>, and <cite index="19-1">documents are searchable by company name, registration number or tax number</cite> |
| Bulk or enriched data at scale | Licensed provider (OPTEN, Dun & Bradstreet, Céginfo) | Paid | The compliant route if volume is needed |

**⚠️ Hard legal constraint on bulk collection.** Free access to published financial statements is explicitly limited: <cite index="27-1">the free-inspection facility may not extend to acquiring the whole or a significant part of the database, and the Company Information Service is required to protect against large-volume downloading and harvesting of the published statement data.</cite>

In practice: **per-user, on-demand lookup at registration is acceptable; building a harvested mirror of the register is not.** Design the integration as a live lookup keyed to the user's own company, cache only that company's record, and never run background bulk collection.

**Proposed flow:** user enters tax number → check-digit validation → `queryTaxpayer` returns official name and address → displayed read-only for user confirmation → optional financial-statement lookup pre-fills revenue and closed business years → user confirms or corrects.

This turns a five-field form into two fields plus a confirmation, which is a material conversion improvement as well as a data-quality one.

### 4.3 Revenue banding ("skatulya" system)

**Why banding is right:** users resist disclosing exact revenue, and bands reduce friction and perceived intrusiveness.

**Why banding alone is wrong:** eligibility rules are threshold-based. A company in a "100–500M HUF" band cannot be assessed against a rule requiring "under 200M HUF" — the engine would have to return `INSUFFICIENT_DATA` for a company whose figure is actually known. That undermines the product's central promise of a definite answer.

**Recommendation — store both:**
- Band, captured at registration for speed (mandatory)
- Exact figure, auto-filled from the published financial statement where available, or optionally entered by the user (optional)
- The engine uses the exact figure when present, falls back to the band, and returns `INSUFFICIENT_DATA` only when the band genuinely straddles a threshold

**Proposed bands**, aligned to the Hungarian SME Act (2004/XXXIV) and the EU SME definition so that eligibility rules map cleanly:

| Band | Net annual revenue | Typical SME category |
|---|---|---|
| 1 | Under 50M HUF | Micro |
| 2 | 50–200M HUF | Micro |
| 3 | 200M–800M HUF (≈ up to €2M) | Micro / Small boundary |
| 4 | 800M HUF – 4bn HUF (≈ up to €10M) | Small |
| 5 | 4bn – 20bn HUF (≈ up to €50M) | Medium |
| 6 | Over 20bn HUF | Large — outside SME schemes |

Note that SME classification depends on **headcount *and* (revenue *or* balance-sheet total)**, plus partner and linked enterprise rules. Revenue banding alone cannot determine SME status. Headcount must therefore also be captured — it is currently missing from the requested list.

### 4.4 Sector

"Sector" must be captured as a **TEÁOR'25 code**, because eligibility rules are written against TEÁOR classes (the existing engine already gates on TEÁOR for the agricultural exclusion and the CAP requirement).

Important: <cite index="34-1">TEÁOR'25 took effect on 1 January 2025, replacing TEÁOR'08, which was in force from 1 January 2008 to 31 December 2024.</cite> <cite index="35-1">Its Hungarian introduction aligns with EU member-state practice, and economic organisations' activity codes changed as a mandatory consequence.</cite>

Implications:
- Use TEÁOR'25 throughout; do not build against TEÁOR'08
- Any grant call published before 2025 may still reference TEÁOR'08 codes — the KSH conversion key must be applied when mapping rules. <cite index="35-1">The conversion key resolves most four-digit TEÁOR'08 classes unambiguously into a single new code, but in roughly 20 percent of cases one old code splits into several.</cite> Those split cases need explicit handling rather than a silent best guess.
- Present a friendly sector picker in the interface, but **store the code**, not the label

### 4.5 GDPR — what "should match GDPR" actually requires

The instruction is correct but not yet a specification. Note first an important distinction:

- **Company data** (company name, tax number, revenue, TEÁOR) is generally **not** personal data for a legal entity — GDPR does not apply to it
- **Sole traders** (*egyéni vállalkozó*) are natural persons, so their business data **is** personal data
- **Contact-person data** (name, email, phone, IP address, behavioural analytics) **is** personal data in every case

Minimum requirements for the registration flow:

**Lawful basis and consent**
- Account creation and service delivery: performance of a contract (Art. 6(1)(b)) — no consent needed
- Marketing email: separate, explicit, opt-in consent (Art. 6(1)(a)), not pre-ticked, not bundled with the terms of service
- Analytics and cookies: separate consent layer; non-essential cookies must not fire before consent

**Interface requirements**
- Terms of Service and Privacy Notice as **two separate checkboxes**, neither pre-ticked
- A layered privacy notice, linked at the point of collection, covering: controller identity, purposes, lawful bases, recipients and processors, retention periods, data-subject rights, and the right to lodge a complaint with NAIH
- Double opt-in email verification
- Withdrawal of consent must be as easy as giving it

**Behind the interface**
- Data minimisation: do not collect at registration what is only needed later (revenue belongs in the company profile step, not the sign-up form)
- Records of processing activities (Art. 30)
- Data processing agreements with every processor (hosting, email, analytics, any data provider)
- Defined retention periods and automated deletion
- Export and erasure functions to satisfy Arts. 15 and 17
- Password hashing (bcrypt/Argon2), TLS enforced, breach-notification procedure (Art. 33 — 72 hours)
- If hosting or any processor sits outside the EEA, a transfer mechanism (SCCs) plus a transfer impact assessment

**Automated decision-making — Art. 22.** The Score and eligibility verdicts are automated evaluations. For legal entities this is not a GDPR issue, but for sole traders it may engage Art. 22. The existing product principle — *the output is a pre-screen, not an official determination*, with itemized human-readable justification and a route to correct the inputs — is exactly the right posture and should be documented as a deliberate safeguard.

### 4.6 The field list is incomplete

The requested list ends mid-sentence. Based on what the eligibility engine actually needs, the following are **missing and required**:

| Field | Why it is needed |
|---|---|
| **Headcount** | Nearly every scheme gates on employee bands; SME status is undeterminable without it |
| **Closed business years** | Both grant calls and the Széchenyi programme require at least one closed year |
| **County / project location** | Regional eligibility (the Budapest and Pest county exclusions already in the engine) |
| **Legal form** | Ltd, sole trader, cooperative — schemes differ by form |
| **Email + password** | Account credentials — absent from the list |
| **Contact person name** | Personal data; needs its own lawful basis |
| Balance-sheet total | Second limb of the SME test |
| Date of incorporation | Start-up versus established schemes |
| De minimis headroom | Already an engine input; ask later, not at registration |
| Development goals | Drives the ProjectFit score factor |

**Recommendation on sequencing.** Do not put all of this in the registration form. Split it:

1. **Registration (30 seconds):** email, password, tax number → auto-filled company name and address → confirm. Consent checkboxes. Nothing else.
2. **Company profile (guided, resumable):** headcount, revenue band, TEÁOR, location, closed years, legal form — largely pre-filled from the financial-statement lookup.
3. **Project context (per assessment):** goals, planned investment, de minimis.

This preserves the existing onboarding design, satisfies data minimisation, and materially improves completion rates over a single long form.

---

## 5. Summary review of the requested points

| Point | Verdict |
|---|---|
| Rebrand to Fundor.hu | **Approved.** Domain secured; tier named Fundor Plus. Trademark clearance still outstanding before public launch. |
| Pull Kavosz loan data | **Right opportunity, wrong method, and regulated.** Loans need a separate instrument model; scraping should be replaced by official documents or a partnership; credit-intermediation licensing must be cleared with counsel. |
| Gate loans behind Fundor Plus | **Sound commercially.** Show existence for free; never paywall disclaimers. |
| GDPR-compliant registration | **Right instinct, needs a real specification.** See §4.5. |
| Exact company name | **Sound** — but auto-fill it rather than asking the user to type it. |
| Tax number lookup via ceginformacio.hu | **Change the source.** Use the NAV `queryTaxpayer` API and e-beszamolo; respect the explicit prohibition on bulk harvesting. |
| Revenue banding | **Good for UX, insufficient for eligibility.** Store band *and* exact figure; align bands to the SME definition. |
| Sector | **Specify as TEÁOR'25 codes**, with TEÁOR'08 conversion handling for older calls. |
| Field list | **Incomplete.** Headcount, closed business years, location and legal form are missing and are required by the engine. |

---

## 6. Open questions

*Resolved: the domain question and the tier-naming question — see the Decision Log.*

1. **Has a trademark search been run for "Fundor"?** Owning the domain does not clear the mark. *Blocks public launch, not development.*
2. **Has anyone approached KAVOSZ** about a data-sharing or partnership arrangement? *Determines whether CR-02 is built on a licensed feed or a small curated dataset.*
3. **Who is the financial-regulatory counsel**, and by when can the credit-intermediation question be answered? ***This gates CR-02 entirely — no loan feature should ship before it is answered.***
4. **Is the repositioning agreed** — from "grant intelligence" to "funding intelligence including subsidised credit"? It changes the value proposition, the landing page and the marketing, not just the data model.
5. **Who is the named data controller**, and are a Privacy Notice and Terms of Service drafted?
6. **What was the intended final item in the registration list?** The original notes end mid-sentence after "Sector". §4.6 proposes the fields the engine requires; that proposal needs confirmation.

---

## 7. Proposed acceptance criteria

**CR-01**
- No occurrence of "Hunter" remains in either language variant, in the page title, in the `TR` dictionary, or in the deployment URL
- The premium tier reads **"Fundor Plus"** consistently in both languages, in the sidebar, the locked section and the upgrade modal
- Site served from `fundor.hu` over HTTPS, with the previous GitHub Pages URL redirecting
- Trademark clearance documented before public launch

**CR-02**
- Every loan record carries: instrument type, interest rate, term, subsidy value, effective-from date, source document reference, last-verified date
- Loans and grants are visually and structurally separated in the interface
- Loan products gated to **Fundor Plus**; free users see the count and category of available loan options but not the product detail
- Legal disclaimer shown to all users, including the free tier — never behind the paywall
- Written legal opinion on credit intermediation on file before release

**CR-03**
- Registration completes in under 60 seconds with only email, password and tax number
- Company name and address auto-filled from the NAV API; user confirms, never types
- Two separate, unticked consent checkboxes; double opt-in verification
- Privacy Notice published and linked at the point of collection
- Revenue stored as band plus optional exact figure; sector stored as TEÁOR'25 code
- Data export and account deletion functions operational
- No bulk collection of any public register; lookups are per-user and on-demand only
