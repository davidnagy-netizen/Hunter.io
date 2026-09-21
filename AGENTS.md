# AGENTS.md

## 1. Project Identity & Domain Context

* **Product Name:** Fundor (formerly HUNTER).
* **Target Domain:** Funding intelligence platform designed specifically for Hungarian Small and Medium Enterprises (SMEs).
* **Primary Domain:** `fundor.hu` served strictly over HTTPS.
* **Subscription Tier:** The premium tier is officially designated as **Fundor Plus**. Never use "Pro", "Hunter Pro", or "Hunter Plus" in code, comments, config keys, database enums, or UI copy.
* **Scoring Nomenclature:** Algorithmic evaluation modules are designated as **Fundor Score** and **Fundor Readiness Score**. All occurrences of "Hunter Score" or "Hunter Readiness Score" are deprecated.

---

## 2. Approved Tech Stack & Strict Technology Boundaries

### ⚠️ STRICT FRAMEWORK & LANGUAGE POLICY

This project strictly standardizes on a **Laravel + React.js** architecture. **No other languages or runtime environments are permitted.**

* **Backend Standard:** **Laravel (PHP 8.2+)** exclusively.
* All RESTful APIs, scheduled tasks, background workers, integrations, database migrations, and business rules must be implemented inside the Laravel application.
* **Frontend Standard:** **React.js (with TypeScript and Vite)** exclusively.
* All client-side components, state management, layouts, and forms must reside strictly in the React TypeScript workspace.
* **Forbidden Technologies:**
* **ABSOLUTELY NO PYTHON** (no FastAPI, Flask, Django, or Python data scraping/automation scripts).
* **NO ALTERNATIVE BACKEND RUNTIMES** (no Node.js backends like Express/NestJS, no Go, Ruby, or Java).
* Any background job, integration worker, or CLI task must be written as a native **Laravel Artisan Command** (`php artisan make:command`) or **Queued Job**, never as standalone scripts in Python or other languages.
* Pull requests containing code in unapproved languages/frameworks will be rejected immediately.

---

## 3. Dev Environment Tips & Commands

### Backend (Laravel)

* Install PHP dependencies: `composer install`
* Run local migrations & seeders: `php artisan migrate`
* Start the local development server: `php artisan serve`
* Code styling and formatting check: `./vendor/bin/pint` or `composer lint`
* Clear and rebuild application caches:
```bash
php artisan optimize:clear
```

### Frontend (React.js + Vite)

* Use `pnpm dlx turbo run where <package_name>` to navigate workspace packages without manual path traversal.
* Install workspace dependencies: `pnpm install --filter <package_name>`
* Start Vite development server: `pnpm --filter <package_name> dev`
* Enforce strict typing in all `tsconfig.json` files (`"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`). Do not use the `any` escape hatch.

---

## 4. Mandatory Specification Rules & Architectural Constraints

### 4.1. CR-01: Rebranding to Fundor.hu

* Perform an exhaustive string replacement across all Laravel views/templates and React components. No occurrence of "Hunter" may remain in UI copy, the central `TR` translation dictionary, the `<title>` tag, page loaders, or footers.
* Update all Laravel mailables and notification configurations to send strictly from the `@fundor.hu` domain.
* Ensure any legacy deployment links or GitHub Pages URLs issue permanent HTTP 301 redirects to `fundor.hu`.

### 4.2. CR-02: Kavosz / Széchenyi Card Loan Handling

* **Regulatory Gate:** Implementation of credit recommendations for Kavosz products is strictly blocked pending formal Hungarian National Bank (MNB) credit-intermediation legal opinion.
* **Scraping Prohibition:** Under no circumstances may developers write automated scrapers targeting `kavosz.hu`. Loan data must be ingested solely from verified manual reviews of official Business Rules (*Üzletszabályzat*) documentation.
* **Data Model Separation:** Differentiate non-repayable grants from debt instruments. Database migrations and Laravel models must enforce an explicit instrument type enum:

```php
enum InstrumentType: string {
    case GRANT = 'grant';
    case SUBSIDISED_LOAN = 'subsidised_loan';
    case GUARANTEE = 'guarantee';
    case COMBINED = 'combined';
}
```

* **Scoring Separation:** Never rank or evaluate loan products using grant-based award scoring algorithms. Loans must evaluate interest subsidies and cost of capital saved rather than treating principal amounts as direct funding.
* **Data Provenance:** Every loan record must store `effective_from_date`, `source_document_reference`, and `last_verified_date`.
* **Fundor Plus Access Gating:** Free accounts may only see aggregate counts and category badges of eligible loan options; full terms and deep product details are gated behind Fundor Plus.
* **Legal Disclaimers:** Mandatory regulatory disclaimers clarifying that outputs are informational pre-screenings and not credit recommendations must remain globally visible and never be placed behind a paywall.

### 4.3. CR-03: Progressive Registration Flow, NAV Lookup & GDPR

* **Three-Stage Registration Architecture:**
1. **Stage 1 (Sign-Up):** Only collect Email, Password, and Tax Number (*adószám*). Auto-fetch official company name and seat address via NAV API and display them as read-only confirmation.
2. **Stage 2 (Company Profile):** Collect headcount, revenue band (plus optional exact revenue), sector code, registered county/location, closed business years, and legal form.
3. **Stage 3 (Project Scope Context):** Collect development goals, investment scale, and historical *de minimis* allocations per evaluation.

* **Official NAV Integration:**
* Do not use or scrape `ceginformacio.hu`.
* Implement a dedicated Laravel Service for the **NAV Online Invoice API (`queryTaxpayer`)** to fetch registered taxpayer name, short name, tax details, and registered address.
* Implement on-demand financial lookups via `e-beszamolo.im.gov.hu` for annual metrics (revenue, headcount, closed business years).
* **No Bulk Harvesting:** Mass automated harvesting of company registries is strictly prohibited; API calls must execute strictly on-demand per registering user and cache only the authenticated organization's record.

* **Tax Number Validation:** Execute Hungarian check-digit validation (CDV algorithm for 8-digit base tax numbers) client-side in React and server-side in a dedicated Laravel `FormRequest` before querying external APIs.

* **Sector Classification (TEÁOR'25):**
* Store economic activities exclusively as **TEÁOR'25** 4-digit codes. Do not store descriptive text or legacy TEÁOR'08 codes as primary database keys.
* Maintain a Laravel mapping service with KSH conversion tables to resolve legacy TEÁOR'08 references found in historical grant documents.

* **Revenue Banding Standards:**
* Store both `revenue_band` (integer 1–6) and an optional `exact_revenue` (decimal).
* Enforce the 6 statutory SME revenue bands (Act XXXIV of 2004 / EU SME definition):
* **Band 1:** Under 50M HUF (Micro).
* **Band 2:** 50M – 200M HUF (Micro).
* **Band 3:** 200M – 800M HUF (Micro / Small boundary).
* **Band 4:** 800M – 4,000M HUF (Small).
* **Band 5:** 4,000M – 20,000M HUF (Medium).
* **Band 6:** Over 20,000M HUF (Large — non-SME).
* If a funding program defines a specific threshold and only a `revenue_band` is provided, the evaluation engine must return `INSUFFICIENT_DATA` rather than guessing.

* **GDPR Compliance Standards:**
* Terms of Service and Privacy Notice must use two independent, non-pre-ticked checkboxes on the React sign-up form.
* Direct marketing requires a separate explicit opt-in checkbox (GDPR Art. 6(1)(a)).
* Send transactional double opt-in email verification using Laravel's native notification system before granting full platform access.
* Provide endpoints for user data export (GDPR Art. 15) and account erasure (GDPR Art. 17).
* Treat sole proprietorship (*egyéni vállalkozó*) business data as protected personal data.

---

## 5. Testing Instructions & Quality Gates

### Backend (Laravel)

* Execute the complete test suite:
```bash
php artisan test
```

* Run isolated Pest/PHPUnit tests:
```bash
php artisan test --filter=TaxNumberValidationTest
```

* Run Laravel Pint to ensure PSR-12 code style compliance:
```bash
./vendor/bin/pint --test
```

* Always write feature tests for NAV lookup API endpoints (using Laravel `Http::fake()`) and unit tests for TEÁOR'25 and CDV validation algorithms.
* Verify that loan models with `instrument_type = subsidised_loan` cannot pass through grant-only score calculation pipelines.

### Frontend (React.js)

* Run unit and component tests via Vitest:
```bash
pnpm turbo run test
```

* Run type checking across all packages:
```bash
pnpm turbo run typecheck
```

* Run ESLint to prevent type violations and syntax regressions:
```bash
pnpm turbo run lint
```

---

## 6. Pull Request (PR) & Git Guidelines

* **Branch Naming Convention:**
* `feat/<scope>-<description>` (e.g., `feat/backend-nav-api-lookup`, `feat/frontend-registration-step1`)
* `fix/<scope>-<description>` (e.g., `fix/scoring-teaor25-mapping`)

* **PR Title Convention:**
* `[api] <Imperative description>` for Laravel backend changes.
* `[web] <Imperative description>` for React frontend changes.
* *Example:* `[api] Implement NAV queryTaxpayer service with check-digit validation`
* *Example:* `[web] Update registration flow to 3-stage onboarding structure`

* **Pre-Commit / Pre-PR Checklist:**
1. No unapproved languages/tools (e.g., Python scripts or auxiliary services) exist in the branch.
2. All Laravel tests pass (`php artisan test`) and code passes formatting (`./vendor/bin/pint`).
3. All React tests (`pnpm test`), typechecks (`pnpm typecheck`), and lint checks (`pnpm lint`) pass.
4. No references to "Hunter" remain in new or modified files.
5. No sensitive credentials, NAV production keys, or client secrets are committed.
