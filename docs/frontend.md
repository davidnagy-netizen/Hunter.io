# Fundor — Frontend (rewrite)

This is the in-progress React rewrite of Fundor's frontend (the product was called
Hunter until 2026-09-20 — see the rename entry in the log). It replaces the
legacy hand-split static app in [`../public`](../public) (global `state`
object, string-templated DOM, inline `onclick` handlers — see the root
[README.md](../README.md) for what the *product* does and how the *server*
works, which this rewrite does not change).

**This document is the living record of the rewrite itself** — the stack, the
architecture rules, and a dated log of consequential decisions. Update it in
the same change whenever something here would otherwise only exist in a chat
transcript: a new dependency, a folder-structure rule, a version pinned below
"latest" for a reason, a feature slice landing, a bug found and fixed along
the way.

The root README/PRODUCT-STATUS docs describe the shipped product and the
Node server; nothing here supersedes them. Once a feature is fully migrated
and cut over, its behavior should still match what those documents promise.

---

## Status

| Slice | Status |
|---|---|
| 0 — Vite/React/TS scaffold, Tailwind theme, shared primitives | ✅ done |
| 1 — Testing infrastructure (Vitest + RTL) | ✅ done |
| `authentication` | ✅ done — login, session, `isAdmin`/`isSubscriber`; registration follows the backend's CR-03 flow (email, password, tax number → NAV confirmation, two consents) |
| `profile` (onboarding + version history) | ✅ done — wizard, server/local sync fork, version history + restore, verified against the real server (profile-sync bug fixed — see [Decisions](#decisions--changes-log)) |
| `scoring` (Fundor Score display + eligibility questions) | ✅ done — **the server is the only scorer** (2026-09-21): the browser shows the score, verdict, checks, factors and questions the API returns, and posts answers |
| `opportunities` (dashboard/list/detail/search/calendar/saved) | ✅ done — app shell, dashboard, list, detail, search, calendar, saved; verified against the real server in all three access tiers |
| `assessment` (free readiness funnel + lead capture) | ✅ done — 6-question funnel, readiness score (ported unchanged; **the keep/replace decision is still open**), censored real matches, lead capture, hand-off into onboarding |
| `landing` (public front door) | ✅ done — pitch, worked example, sources, price; replaces the temporary showcase page |
| `admin` (overview, users, system) | ✅ done — unit-tested (65 tests); signed-in pass done by the developer, who reported it "all good" (2026-09-20) |
| `crm` (pipeline, contacts, leads, insights, contact record) | ✅ done — unit-tested (127 tests); signed-in pass done by the developer, who reported it "all good" (2026-09-20) |
| `fundor-plus` (demo) | ✅ done — unit-tested (29 tests); locked screen, nav and mobile bar checked in a browser as an anonymous visitor by the assistant; workspace: signed-in pass done by the developer, who reported it "all good" (2026-09-20) |

Served by the Laravel app (2026-09-21): `npm run build` writes to `../public/spa` and Laravel's fallback route serves
it, replacing the backend's Blade/React pages. Every signed-in flow still needs a person to sign in and look — the
assistant that wrote this never types passwords or creates accounts (see the log).

---

## Stack

Versions are what was actually installed at scaffold time (2026-09-19), not
copied from documentation — see [`package.json`](package.json) for the exact
resolved versions.

| Concern | Choice | Version | Notes |
|---|---|---|---|
| Framework | React | 19.2.x | |
| Build tool | Vite | 8.3.x | |
| Language | TypeScript | **~6.0.2**, pinned below npm's `latest` (7.0.2) | See [Decisions](#decisions--changes-log) |
| Styling | Tailwind CSS | 4.3.x (`@tailwindcss/vite`, CSS-first `@theme`) | |
| Server state | TanStack React Query | 5.103.x | + `@tanstack/react-query-devtools` in dev |
| Client state | Zustand | 5.0.x | Chosen over Redux Toolkit — see [Decisions](#decisions--changes-log) |
| HTTP client | Axios | 1.20.x | One instance in `shared/api`, never called directly from components |
| Routing | `react-router` | 8.4.x | **Not** `react-router-dom` — see [Decisions](#decisions--changes-log) |
| Forms | React Hook Form + Zod + `@hookform/resolvers` | 7.88.x / 4.6.x / 5.9.x | Zod also used to validate API responses at the boundary, not just form input |
| i18n | i18next + react-i18next | 26.4.x / 17.0.x | HU default, EN fallback; per-feature namespaces — see [Decisions](#decisions--changes-log) |
| Testing | Vitest + React Testing Library | 5.0.x / 16.3.x | + `@testing-library/jest-dom`, `@testing-library/user-event`, `@vitest/coverage-v8` |
| Lint | Oxlint (Vite 8's default) | 1.81.x | Not ESLint — this was the scaffold's own default, kept as-is |

Zero backend changes are implied by any of the above — this is a frontend-only
rewrite against the existing REST API documented in the root README.

---

## Architecture

Feature-based, not organized by technical layer. See the root README's linked
analysis (or ask in-session) for the full rationale; the short version:

```
src/
├── app/            # router, providers (QueryClient, etc.), layout (AppShell, RequireProfile), the `app` i18n namespace
├── features/       # one folder per bounded piece of product functionality
│   └── <feature>/
│       ├── components/   # feature-owned UI
│       ├── hooks/         # feature-owned hooks (business logic lives here, not in JSX)
│       ├── api/           # feature-owned Axios calls + React Query hooks + query-key factory
│       ├── types/         # feature-owned types
│       └── domain/        # (scoring, assessment only) pure business-rule functions
└── shared/         # genuinely cross-feature only — see rule below
    ├── components/  # generic, domain-free UI atoms (Button, Badge, Panel, CircularProgress, TextField, SelectField, ChipButton, LanguageToggle, Logo, icons)
    ├── hooks/        # useLang / useFormat (language-bound money and date formatters)
    ├── api/          # the Axios instance, typed ApiError mapping, useTranslatedApiError
    ├── lib/          # format.ts (formatHuf, formatDate)
    ├── store/        # cross-feature client state (Zustand) — currently just `uiStore` (language)
    ├── i18n/          # i18next setup + the `errors` namespace (shared across every feature)
    └── types/
```

A feature that has its own translated strings owns an `i18n/` folder too
(`hu.json`/`en.json` + an `index.ts` that calls
`registerFeatureTranslations()`), imported once from that feature's entry
component — this keeps `shared/i18n` from having to import from `features/`,
which would invert the dependency direction. See `features/authentication/i18n/`
for the reference example.

**Feature list and dependency direction** (no cycles — a feature only depends
on the ones listed before it):

```
authentication → profile → scoring → opportunities → assessment
                                        ↘ fundor-plus   (authentication, profile, scoring, opportunities → fundor-plus)
authentication → admin   (+ opportunities, for its cache key only: a catalog refresh invalidates it)
profile, opportunities → assessment;   authentication, profile → landing
authentication, admin (GrantForm, ProfileChanges, activity names), profile (types only) → crm
```

**Rules that keep this from rotting back into a components/hooks/utils dump:**

1. A feature owns its components/hooks/api/types/logic unless something is
   genuinely used by two or more features — then, and only then, it moves to
   `shared/`. Don't pre-emptively shared-ify something "in case."
2. `shared/components` holds generic primitives with no domain meaning
   (`Badge` takes a `tone`, not an eligibility verdict). A feature-specific
   component that happens to reuse a shared primitive still lives in its
   feature (e.g. the opportunity card lives in `features/opportunities`, even
   though it's built from `shared/components/Badge`).
3. Business logic (scoring math, form validation rules, data transforms)
   lives in a feature's `hooks/`/`domain/`/`api/`, never inline in JSX.
   Components stay presentational: `Component → hook → service/API`.
4. `app/` composes features together (routing, the sidebar/nav shell); it
   does not contain feature logic. Each feature describes its own nav entries
   (`features/<name>/nav.ts`, typed by `shared/types/navigation.types.ts`);
   `app/layout/AppShell.tsx` concatenates them. Adding a feature to the nav is
   one line there.

---

## API contract

The contract is the backend's [`../openapi.yaml`](../openapi.yaml) (OpenAPI 3.0.3, v2.3.0 — 32 operations), with setup
notes in [`../docs/FRONTEND-API.md`](../docs/FRONTEND-API.md). Open it in <https://editor.swagger.io> (File → Import
file). The frontend's own copy of the spec was removed when this folder moved into the Laravel repository: the backend
implemented the same 32 operations (identical operation ids) and its file is now the single source of truth.

Two things read it. `src/shared/i18n/errorCodes.test.ts` fails if any error code listed in the contract has no
Hungarian or English message, and a new call in a `*.api.ts` file should be checked against it. Requests must follow
its rules: **JSON body on every POST** (`{}` when there is nothing to say — `shared/api/httpClient.ts` does this), the
session cookie on every request, and **same-origin** (the dev proxy must not rewrite `Host`).

---

## Path alias

`@/...` resolves to `src/...` (configured in both `vite.config.ts` and
`tsconfig.app.json` — keep them in sync if this ever changes).

There is no second alias any more: the vendored browser engine (`@engine-src`) was removed on 2026-09-21 when scoring
moved to the server.

---

## Design system

Tokens in [`src/index.css`](src/index.css) are ported 1:1 from the legacy
app's [`../public/css/app.css`](../public/css/app.css) `:root` block — same
hex values for ink/paper/surface/line/text/muted and the semantic palette
(gold/green/amber/red/slate/blue), same radii and shadow levels, same two
typefaces (Space Grotesk for display, Inter for body — both needed for full
Hungarian diacritic coverage, do not swap fonts without checking that).

Tailwind v4 reads the `@theme` block directly, so `--color-gold` etc. are
already usable as `bg-gold`, `text-gold`, `border-gold`, and so on — no
`tailwind.config.js` needed.

The goal during migration is to **reproduce the existing UI while
establishing consistency**, not transcribe the legacy CSS class-by-class.
Where the legacy app has 3–4 near-duplicate implementations of the same
pattern (e.g. four different "opportunity card" renderers, three independent
score-ring SVGs), the rewrite should converge them into one component, not
port each copy separately.

---

## Testing

Vitest + React Testing Library, configured in
[`vitest.config.ts`](vitest.config.ts) (extends `vite.config.ts` so aliases
and plugins match the real build) and
[`src/test/setup.ts`](src/test/setup.ts) (jest-dom matchers, automatic
`cleanup()` between tests).

**Why Vitest instead of Jest:** this is a Vite project — Vitest reuses the
same transform pipeline and config (including the `@` alias) with no extra
babel/ts-jest wiring, and its API is close enough to Jest's that nothing
here is one-way. Jest would work but would need its own separate
configuration to resolve Vite-specific things (the `@` alias,
`import.meta.env`) that Vitest gets for free.

**Real API responses, not invented ones.** `src/test/fixtures/api/*.json` are recorded from the running Laravel app for
one subscriber company (`php frontend/scripts/generate-api-fixtures.php` regenerates them on an in-memory database),
and `fixtures/api/contract.test.ts` validates every one against `../openapi.yaml`. Screen tests build on them through
`src/test/apiFixtures.ts`, so a test can't rest on a response shape the API never sends, and a backend change that
breaks the contract fails here. Regenerate after changing the backend's scoring or catalog.

**Conventions:**
- Tests are colocated with the source file: `Button.tsx` + `Button.test.tsx`
  in the same folder, not a parallel `__tests__/` tree.
- Import `describe`/`it`/`expect`/`vi` explicitly from `vitest` (no
  `globals: true`) — consistent with the project's general preference for
  explicit dependencies over ambient globals.
- Test behavior visible to a user (rendered text, roles, classes that encode
  a real visual state), not implementation details.
- `npm test` runs once (CI-style); `npm run test:watch` for local dev;
  `npm run coverage` for a coverage report.

**What's covered so far:** the five shared primitives
(`Button`/`Badge`/`Panel`/`CircularProgress`/`TextField`/`SelectField`/`ChipButton`),
the `authentication` feature, and the `profile` feature (schema, local store,
the `useCompanyProfile` sync-fork hook, `OnboardingWizard`, `ProfileHistoryPanel`),
and the `scoring` feature (the answers hook with optimistic update/rollback and server re-scoring, and its
four components) — 518 tests, all passing (slices 5–7 added the `opportunities` screens and forks, the app-shell guard, the assessment funnel, lead capture, the landing page, the loader and the shared motion components; slice 8 the admin console, its route guard, the workspace switch and the admin-aware redirects; slice 9 the CRM, the shared `Dialog` and `Pager`; slice 10 Fundor Plus and the nav badge / short-label slots).

Feature tests that need React Query and/or routing use
[`src/test/renderWithProviders.tsx`](src/test/renderWithProviders.tsx)
instead of RTL's bare `render`. API calls are mocked at the feature's
`*.api.ts` module boundary (`vi.mock("../api/auth.api", ...)`), not at the
network layer — no MSW yet; revisit if that stops scaling.

---

## Getting started

`resources/js/` lives inside the Laravel repository. The dev server proxies `/api/*` to the Laravel app, so the backend
must be running for anything past the shared primitives.

```bash
# from the repo root (one-time): PHP 8.2+, Composer, Node 22+
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate
php artisan db:seed --class=OpportunitySeeder   # four demo calls; creates NO accounts
```

```bash
# terminal 1, from the repo root:
php artisan serve --host=127.0.0.1 --port=8000
```

```bash
# terminal 2, from the repository root:
npm ci
npm run dev          # http://localhost:5173, proxies /api to 127.0.0.1:8000
npm test             # run the test suite once
npm run lint         # oxlint
npm run build        # tsc -b && vite build → ../public/spa
```

Two ways to look at it: the Vite dev server (hot reload) at <http://localhost:5173>, or `npm run build` and browse
<http://127.0.0.1:8000> — Laravel serves the built app itself. `composer dev` from the repo root starts the backend and
the Vite server together.

Notes:
- **Do not run `DatabaseSeeder`** on a shared database — it creates demonstration credentials.
- The repo has no `storage/` skeleton, so on a fresh clone create it before `composer install`:
  `mkdir -p storage/framework/{cache/data,sessions,views} storage/logs storage/app/public bootstrap/cache`.
- The backend's suite (`php artisan test`) needs no frontend build: the Blade pages are gone, and the SPA route is
  tested against a temporary `index.html`.
- Point the proxy elsewhere with `VITE_API_PROXY_TARGET`. Keep browser requests same-origin: the API answers
  `403 CSRF_REJECTED` when a mutation's `Origin` differs from its `Host`.
- To get an administrator for admin screens, the backend's guide grants the role to a development account through
  Tinker (`docs/FRONTEND-API.md`). Nothing here creates credentials for you.

---

## Decisions & changes log

Newest first. Each entry says what changed, why, and what it affects — the
things that would otherwise only live in a chat transcript.

> **Naming.** The product was renamed **Hunter → Fundor** on 2026-09-20 (see the
> first entry). Entries dated before that, and the ones written earlier the same
> day, are a dated record and keep the old name and old identifiers
> (`hunter-plus`, `HunterScoreRing`, `useHunterScore`, `hunter-rewrite-*`). The
> current names are `fundor-plus`, `FundorScoreRing`, `useFundorScore`,
> `fundor-rewrite-*`.

### 2026-09-21 — One app: served by Laravel, scored by the server, registration per CR-03
Three decisions from the developer, all now built:

**1. This frontend replaces the backend's Blade + React-in-Blade pages.** Vite builds to `../public/spa` (`base: /spa/`
only for `build`; dev serves `/`), and a single Laravel route (`routes/web.php`, `->name('spa')`) returns
`public/spa/index.html` for every GET that isn't `/api/...`, so deep links and reloads work. The Blade views, their web
controllers, `SetLocale`, `resources/{views,js,css}`, `public/{css,images,vendor}` and the root `package.json`/Vite
config were removed. A missing build answers `503` with the command to run. `/api/health` replaced the Blade health
page. Seven tests cover the fallback (`SpaFallbackTest`).

**2. The server is the only scorer.** The backend has a scoring engine (`App\Services\Api\Scoring`), so the vendored JS
engine is gone. This reverses the earlier "keep the client engine as a fallback" decision, at the developer's request.
What it took:
- *Measured first, not assumed.* The PHP scorer was compared with the JS engine on 48 real calls × 8 companies. Two
  defects were found and fixed in the backend: `sector` was never derived from the activity code (fixed with
  `SectorMap`, checked against all 99 divisions), and explanations lacked the JS engine's factor labels/details. The
  comparison is frozen as golden tests (`ScoringParityTest`, fixtures in `tests/Fixtures/scoring`), so the scorer can't
  drift from the reviewed formulas silently.
- *The catalog is scored for subscribers.* `GET /catalog` used to return unscored rows to a subscriber and expect the
  browser to score them. It now returns every open call with `score, verdict, band, checks, factors, conditions,
  questions, calculator` for the caller's stored company, plus `stats` (contract: `ScoredOpportunity`). Non-subscribers
  still get censored teasers only (`SubscriberScoringTest`).
- *Frontend.* Catalog/search/detail requests carry `lang` (the server words check labels, factor details, conditions and
  questions) and the language is part of every key. A profile save, demo load, restore or answered question invalidates
  the scored queries (`shared/api/opportunitiesKeys`, shared so `profile` and `scoring` can do it without importing
  `opportunities`). Screens read a flat `ScoredOpportunity`; the client only orders the catalog for display (best score
  first, blocked last, past-deadline dropped) and hides prizes and labels (`awardsFunding: false`). An answer is posted;
  the server re-scores, the answered call comes back in the response, the rest refetch.
- *Removed:* `vendor/engine-src`, `@engine-src`, `features/scoring/domain/engine*`, `useScoring*`, the local answers
  store, the local grant calculator. The anonymous visitor's browser-held answers went too: questions only appear on a
  call's detail page, which needs a subscription.
- *Behaviour changes you will notice.* (a) The grant calculator no longer has an editable project value: it shows the
  server's figures for the value in the profile and links to the profile to change it (the server has no what-if
  endpoint, and re-implementing the arithmetic in the browser is the drift this decision removes). (b) An answered
  question re-scores after a round trip instead of instantly. (c) The dashboard's stat tiles come from the server's
  `stats` for every tier. (d) The "closing soon" and calendar urgency use the server's `daysLeft`, i.e. the server's clock.
- *Tests* are built on recorded API responses (see Testing) and validated against the contract.

**3. Registration follows the backend (CR-03).** Step 1: email, password, tax number (check digit validated in the
browser, same rule as the backend) and **two separate unticked consents** — terms + privacy (required), marketing
(optional). The company is looked up with `POST /api/nav/taxpayer` and shown read-only; the visitor confirms it and picks
a username (prefilled from the email), and the account is created with NAV's official name. The confirmed name and tax
number carry into the onboarding wizard (name read-only, tax number saved with the profile as an extra field, which the
server keeps). `/nav/taxpayer` and `TAXPAYER_LOOKUP_FAILED` were missing from the contract; they are in it now, with a
recorded response fixture.

Things the backend does not do yet, that this screen therefore cannot honestly claim (flag to the product owner):
- **Consents are not recorded.** `POST /auth/register` takes no consent, so the two boxes gate the form but nothing is
  stored — a GDPR record of consent needs a backend field (and timestamp, and the wording version).
- **The tax number is not persisted by registration**, only later with the profile as an unlisted extra field.
- **`/nav/taxpayer` is unauthenticated and unthrottled** and, when NAV isn't configured (`NAV_BASE_URL`), returns
  *invented* companies ("Magyar Vállalkozás …") — fine for a demo, wrong in production. It is exactly the bulk-lookup
  surface CR-03 forbids without a rate limit.
- **No Terms/Privacy pages exist** to link from the consent line, and there is no double opt-in email.
- **Revenue bands:** the backend has the six statutory bands in `TeaorClassificationService` but does not expose or use
  them in scoring; the profile still stores the older five-band `revBand` string from `/meta`, so the wizard keeps that.
  An exact-revenue field would be kept by the server but ignored by the scorer, so it was not added.
- Stages 2 and 3 of the spec's progressive registration (company profile, project context) are the existing onboarding
  wizard; nothing more was added there.

### 2026-09-21 — Moved into the Laravel repository
The backend team rewrote the backend in Laravel (repository `origin/main`, history unrelated to the old Node/Hunter
repository). The frontend now lives at `resources/js/` in that repository, on branch `feat/frontend-rewrite`; its 12
commits are preserved (reachable through the merge commit's second parent). **Paths such as `../server`, `../public`
and `../src` in the older entries below refer to the old Node repository.**

The backend implements the same 32-operation contract this frontend was written against (its `openapi.yaml` has the
same operation ids; the schemas differ only where noted below), so no screen had to be rewritten. What had to change:
- **The scoring engine is vendored.** *(Superseded the same day — see the entry above: the engine was removed and the server scores.)* The frontend imported its browser-side engine from the Node server's `src/`, which
  the Laravel repository doesn't have. Six pure files (about 50 kB) now live in `vendor/engine-src/`, unchanged, behind a
  renamed alias (`@engine-src`). **Risk:** the PHP backend has its own implementation of the formulas, so the browser
  and the API can now disagree. No parity test exists yet.
- **Every POST needs a JSON body.** Logout, load-demo, refresh and save-toggle sent none, and the API answers
  `415 JSON_REQUIRED`. `httpClient` now sends `{}`. Verified against the running backend (415 without, 200 with).
- **The dev proxy must not rewrite `Host`.** The API compares a mutation's `Origin` with its `Host` and answers
  `403 CSRF_REJECTED` otherwise; `changeOrigin` is now `false` and the target is `127.0.0.1:8000`. Verified: a POST
  with a mismatched Origin is rejected, the same POST through the proxy succeeds.
- **Eight new error codes are translated** (`INVALID_REQUEST`, `INTERNAL_ERROR`, `JSON_REQUIRED`, `CSRF_REJECTED`,
  `EMAIL_TAKEN`, `REFRESH_UNAVAILABLE`, `NO_SUCH_OPPORTUNITY`, `FIELD_REQUIRED`), and a test reads the code list from the
  contract so a future addition can't ship without a message.
- **CRM revenue can be unknown.** With plan prices unset, the API returns `null` for MRR, ARR, average per account,
  expected value, each contact's monthly value and per-plan revenue. The screens show a dash and say why — never a
  made-up 0 Ft.
- Also: my own comments that said the browser engine "cannot drift" from the server were corrected, and two comments the
  rename had inverted ("never says Fundor") were fixed.

Verified against the running Laravel app (anonymous flows only — see below): `GET /auth/me`, `/meta`, `/catalog`,
`POST /catalog` and `/search` with a browser-held profile, and the error shapes all validate against the contract's
schemas. In a browser at `localhost:5174`, the dashboard, opportunities and search screens render the API's four
demo calls as censored matches with no error banner, and every request returns 200. The backend's own tests pass
(30 of 30) once its root assets are built. 483 frontend tests.

**Not verified:** any signed-in flow (login, onboarding save, admin, CRM, saved calls, answers). Those need an account,
and creating one or typing a password is left to a person. The contract tests and unit tests cover their shapes; the
running app has not been exercised signed in.

Status of the issues found in the old Node server (they were written up in the spec that was removed from this repo):
refresh without authentication, shared anonymous state, `load-demo` ignoring the user, `adminSeed` disclosure and the
locked-detail leak are **fixed** in the Laravel backend (checked in code, plus one anonymous GET of a locked detail);
the **minimum password length is still 4**; the CRM board's `pipelineValueHuf` and task cap were not re-checked.

Open decisions and follow-ups:
- **Two frontends now exist.** *(Resolved the same day: this app replaces the Blade pages — see above.)* The backend has its own Blade pages with React components (`resources/js`) at the same
  URLs as this app (`/`, `/login`, `/register`, `/onboarding`, `/opportunities`, `/assessment`, `/admin/*`). Someone has to
  decide whether this app replaces them or is served under its own path, and then add the fallback route, base path and
  build output that implies. Nothing of that is done.
- **Parity test** between the vendored engine and the PHP scoring. *(Done: golden tests in the backend.)*
- **CR-03 in the UI.** *(Done — see above.)* The backend added `POST /api/nav/taxpayer` and a three-stage registration; this frontend's
  registration and onboarding don't use them yet.
- Backend notes: the repository has no `storage/` skeleton (a fresh `composer install` fails), and
  `bootstrap/cache/packages.php` and `services.php` are tracked although generated.

### 2026-09-20 — Rename: Hunter → Fundor (CR-01)
The product is now **Fundor**, at **fundor.hu** (`hunter.io` is not available).
Source: `../FUNDOR-CHANGE-SPECIFICATION.md` v0.2 — decision D-01 (the domain) and
D-02 (the premium tier is **Fundor Plus**; the old "Pro" wording is superseded).
Only CR-01 (the rename) is done here; CR-02 (loans) and CR-03 (registration) are
not started — see the end of this entry. Frontend only: the legacy `public/`, the
server and the root `src/` are untouched (standing rule), so the backend and the
root docs still say Hunter — the list is below and in the API spec.

Changed:
- **What users see:** the wordmark (top bar, sign-in, onboarding), the page title,
  and every translated string in both languages — *Fundor Score*, *Fundor
  Readiness Score*, *Fundor Plus*, the landing page and its footer, the opportunity
  and calendar copy, the score labels and their screen-reader text. The nav tag
  on Fundor Plus is now **PLUS** (was PRO, per D-02).
- **What developers see:** the score ring, hook and result type
  (`FundorScoreRing`, `useFundorScore`, `FundorScoreResult`), the feature folder
  (`features/fundor-plus`) and the browser storage keys (`fundor-rewrite-*`).
  The storage keys are safe to change now because nothing has shipped; a browser
  that ran a development build loses its saved profile, answers and language
  choice once.
- **One place for the name in code:** `shared/brand.ts` (`BRAND`), used by the
  wordmark, the sign-in header and the score labels. Translated copy says
  "Fundor" literally.
- **The server's own name for the engine** (`hunterScore`) is renamed at a single
  boundary — `scoring/domain/engine.ts` re-exports it as `fundorScore` — so the
  rest of the app never says Hunter.
- **`brand.test.ts` turns the acceptance criterion into a test:** no old name in
  any locale file (either language), in any source file, in `index.html` or in
  `public/`, apart from an allow-list of server-owned tokens (`HUNTER_*` env
  vars, `hunter_state`, `hunterScore`, a document's filename). Checked to fail
  when the old name is put back. Also verified in a browser: 18 route × language
  combinations render no "Hunter" (text, labels, alt text or title).
- 438 tests (6 new).

Not done, and why:
- **No new logo or favicon.** None was provided. The wordmark is text; the mark
  is still the *target/crosshair* icon (a hunting metaphor that no longer fits the
  name) and the favicon is still the Vite scaffold's placeholder. Both need a
  designer, and are the one visible part of CR-01 that is unfinished.
- **The tagline still says "grant finder"** ("rule-based grant finder · MVP
  prototype"). The spec's open question 4 — repositioning to "funding intelligence
  including subsidised credit" — is undecided, so the copy was renamed, not
  rewritten.
- **Trademark clearance (HIPO / EUIPO) and defensive domains** (`fundor.com`, `.eu`,
  misspellings) are outstanding per the spec — the name should not appear in
  public-facing material until they are cleared.
- **The backend still says Hunter** (for the backend team): the session cookie
  `hunter_session` (renaming it signs everyone out once — accept both for a week),
  the CSV download name `hunter-crm-contacts.csv`, `/health`'s
  `service: "HUNTER API"`, the seeded admin account's company name
  "Hunter — adminisztráció" (shown in the admin console), the `HUNTER_*`
  environment variables, `package.json`'s name, `render.yaml`'s service name (and
  so the hosting URL), the engine's `hunterScore`, and the root `README.md`,
  `PRODUCT-STATUS.md` and `HUNTER-PROJECT-OVERVIEW.md`. Hosting for `fundor.hu`
  (TLS, cookie `Domain`/`Secure`, the redirect from any old link) is theirs too.
- **Nothing to change** for the spec's email-sender, privacy-notice and terms
  references: the frontend has none of those yet (they arrive with CR-03).
- **Hungarian suffixes.** Suffixes follow the last vowel: *Hunter* took front-vowel
  endings (*Hunterrel*, *Hunternek*, *Hunterhez*), *Fundor* takes back-vowel ones
  (*Fundorral*, *Fundornak*, *Fundorhoz*). No suffixed form appears in the copy
  today (the article — "a Fundor megtalálja neked" — is unaffected), but any
  future copy that suffixes the name must use the back-vowel forms.
- **Not started: CR-02 and CR-03.** CR-02 (subsidised loans) is blocked by the
  spec's own legal question and needs an instrument-type model on every record;
  CR-03 (registration with a NAV company lookup, revenue bands, TEÁOR'25) needs
  new backend endpoints. Neither is a rename.
- Seen along the way, unrelated and older: the Hungarian calendar heading reads
  "Funding Calendar" — the legacy app never translated it either (its
  `L("Funding Calendar")` has no entry), and it was ported as it was.


### 2026-09-20 — `hunter-plus` (slice 10): the labelled demo, gated by real access
The last planned slice. Hunter Plus is, by the product's own admission
(`PRODUCT-STATUS.md` §3.3–3.4), a **demo**: pick a call that fits the company,
tick off the documents it asks for, and generate a fixed three-chapter
application template filled with the company's and the call's real figures.
There is no AI and no server side. It is at `/app/plus`, the last entry in the
client nav.

**Product decision, flagged — the browser "activate" switch is not ported.**
In the legacy app, "Activate preview" wrote a flag into the visitor's own
browser and unlocked the screen for free; `PRODUCT-STATUS.md` §3.3 calls that
out as a paywall hole. Here the screen is gated by the account's **real
entitlements** (`useIsSubscriber()` — a subscriber or an admin), the same
thing the server enforces on the catalog. Everyone else sees an honest
description (what it is, that it isn't AI, that access is granted by an
administrator for now) and, if they have no account, a link to register —
and no button that pretends to unlock anything. The activation modal is gone
with it. This is a behaviour change on a product question; if you *want* a
public, self-service preview, it is a small addition (a persisted flag beside
the docs store), but it would reopen the hole.

Built (`features/hunter-plus`):
- `domain/draft.ts` (`draftFigures`, `draftToText`), `domain/documents.ts`,
  `store/docChecksStore` (Zustand + persist, key `hunter-rewrite-plus-docs`),
  `hooks/useDraftChapters`, and the components `PlusPage` (the gate),
  `PlusLockScreen`, `PlusWorkspace`, `GrantPicker`, `DocumentChecklist`,
  `DraftPanel`, `PlusNavBadge`.
- **The draft is derived on every render, not stored.** The legacy stored both
  languages in state; here switching language re-words it and changing the call
  drops it (the panel remounts on `key`), with nothing to keep in sync. Text
  lives in `i18n/{hu,en}.json` as templates.
- Shell: `NavItem` gained an optional `badge` component ("PRO" for a
  subscriber, a lock for anyone else — read from the real entitlements) and an
  optional `shortLabelKey` for the narrow bottom bar. The shell also prints
  cleanly now (`print:hidden` on the sidebar and bars), because "Print / Save
  PDF" is a feature of this screen.
- Shared: `useGoalLabel()` — the third place needing "goal id → name", so admin's
  `ProfileChanges` and the CRM's `ProfilePanel` now use it instead of their own
  copies.
- 37 new tests (432 total; 29 in the feature itself, the rest for `useGoalLabel`, the shell's badge and short label, and the nav). Two were checked to fail when the behaviour they
  guard is removed: the access gate, and the draft resetting when the call
  changes.

Deliberate changes from the legacy screen:
- **Gated by entitlement, not a browser flag** (above).
- **Goals are shown by name.** The legacy printed raw ids ("circular,
  environment") into the text.
- **No invented numbers.** The legacy fell back to a 30 M Ft project value when
  none was set (a profile always has one now) and printed `undefined` for a
  missing NACE code; the activity sentence is now simply reworded without it,
  and a call with no intensity yields no grant rather than `NaN`.
- **A tick stays on its document.** Checks are keyed by the document's text,
  not its position, so a catalog refresh that reorders the list can't move
  them.
- **With no fitting call, the screen says so** instead of falling back to
  the catalog's first call, however ineligible.
- **The generate / copy toasts are inline messages** (there is no toast
  system, by design); a failed clipboard write is reported rather than
  silently ignored.
- **The mobile bottom bar now has all six entries** (the legacy hid Calendar
  and Plus there). To fit 375 px they use a smaller label and, for Hunter Plus,
  a short one ("Plus"); checked in a browser in both languages — nothing
  truncates.

Verification status, stated plainly: unit tests, `tsc`, lint and the build are
green. In a browser, as an anonymous visitor: the locked screen (four features,
register link, **no unlock control**), the lock on the nav item, and the mobile
bar. The workspace itself needs a subscriber or admin session, so the
assistant never saw it live; **the developer did the signed-in pass over the
admin console, the CRM and Hunter Plus
(2026-09-20).** That was the developer's own check: the assistant did not observe it
and has no record of what was clicked or whether anything was adjusted.

## All planned slices are built

Every slice of the agreed plan now exists in `resources/js/`. What stands between
this and cutting over from `../public`:
1. ~~The signed-in browser pass~~ (admin, CRM, Hunter Plus workspace) — done by
   the developer (2026-09-20).
2. **Open product decisions:** the readiness-score keep/replace, the landing
   copy that contradicts `PRODUCT-STATUS.md`, and the Hunter Plus gate above.
3. **Server fix:** `POST /api/refresh` is unauthenticated (see the slice 8
   entry).
4. **Follow-ups:** route-level code splitting (the main chunk is over 500 kB),
   the account/subscription screen, `MatchingLoader` on the onboarding finish,
   and folding `opportunities`' `CatalogStatus` into the shared `QueryStatus`.

### 2026-09-20 — `crm` part 2 (slice 9): contacts, leads, insights
Finishes the CRM. Three more tabs, each a route (`/admin/crm/contacts`,
`/leads`, `/insights`), and the tab strip now shows counts (open deals,
contacts, leads) from the server's own metrics.

Built:
- **Contacts** — search, stage / lifecycle / source filters, six sorts, paging,
  and a CSV export. The whole view is the URL (`?q=&stage=&sort=&page=`), so it
  can be linked, survives a reload, and the back button steps through it;
  changing any filter goes back to page 1. The export is a plain download link
  built from the same filter (minus paging), so it carries the session cookie
  itself and downloads exactly what the list shows. The previous page stays on
  screen while the next filter loads.
- **Leads** — who finished the free assessment and asked to be contacted, with
  what they submitted (readiness, staff, county, project value) and a badge
  when a lead has since become an account.
- **Insights** — MRR / ARR / average per account / trial→paid, the acquisition
  funnel, contacts by stage, revenue by plan, sources, a six-month chart as
  inline SVG (no chart library), and the accounts that are active but not yet
  subscribed, in call order. Where there is nothing to measure it shows a dash
  and says why, never a zero: "no trial has completed yet", not "0%". The bar
  and chart geometry is pure functions (`domain/insights.ts`), tested apart
  from the SVG.
- **Shared:** `Pager`, extracted from the search page's inline copy — the search
  page now uses it too, and its three private pager strings are gone.
- 49 new tests (395 total), including that "back" from a contact returns to
  the exact filtered list it was opened from.

Deliberate changes from the legacy CRM:
- **"Back" from a contact returns to the tab — with its filters — it was opened
  from** (recorded in navigation state by `ContactLink`); the legacy remembered
  the tab in memory. Opened directly, it goes to the pipeline.
- **Contacts are a real table with a horizontal-scroll wrapper**, not the
  legacy's page-wide overflow; the search runs on Enter / the button, as the
  legacy did (its `change` event), not per keystroke.
- **The tab is a route**, so each can be linked; the legacy held it in state.

Not exposed, because the legacy did not either: the server's `owner`, `tag`,
`kind`, `minEngagement`, `hasOpenTask` and `overdue` contact filters, and the
`facets`, `owners` and `tags` it returns alongside the list. Adding an owner
filter would be small if the team wants one.

Verification status: unit tests, `tsc`, lint and the build are green, and the
**signed-in browser pass for the admin console and the CRM was done by the
developer (2026-09-20)** — the assistant does
not type the admin password, so it did not observe that pass.

### 2026-09-20 — `crm` part 1 (slice 9): the pipeline and the contact record
The CRM is split like `opportunities` was. Part 1 is the two screens everything
else hangs off: the **pipeline** (`/admin/crm`) and the **contact record**
(`/admin/crm/contact/:id`). Part 2 (contacts list, leads, insights) is the entry
above. The CRM sits second in the admin nav, as in the legacy console.

Built:
- **Pipeline:** five headline numbers (MRR with subscribers and ARR, running
  trials with conversion, open deals with expected value, overdue tasks with
  due-today, lapsed with churn), the overdue follow-ups, and one column per
  stage. Cards are draggable; each also has a stage dropdown, which is the
  keyboard/touch route. Every figure is the server's — the screen computes
  nothing but "overdue" from the open-task list, as the legacy did.
- **Contact record:** notes (with a kind — a call is not a decision),
  follow-ups (tick, untick, delete, overdue flagged), timeline, engagement (the
  score *and* the rows that produced it), company profile with goals by name,
  saved calls, owner/tags, and — for accounts — the same grant / revoke form as
  the users page, reused rather than copied (`admin`'s `GrantForm` gained an
  `onChanged` callback so the CRM caches refetch). A lead gets its assessment
  score and a delete button instead of access and engagement.
- **Shared:** `Dialog` (an accessible modal primitive: focus in and back out,
  Escape, backdrop), `formatMoney` / `useFormat().money` (the full `5 990 Ft`
  for figures people write down, next to the abbreviating `formatHuf`).
- **From `admin`, reused:** `GrantForm`, `ProfileChanges`, `useActivityLabel`.
  Dependency direction stays acyclic: `crm → admin → authentication`.
- 78 new tests (346 total). Two were checked to fail when the behaviour they
  guard is removed (the drop-on-own-column guard, and — in slice 8 — the
  cache invalidation).

Verification status, stated plainly: unit tests, `tsc`, lint and the build are
green, and an anonymous visit to `/admin/crm/...` was confirmed in the browser
to land on `/login` without a single `/api/admin` request. **The signed-in
pass was later done by the developer
(2026-09-20)** — the assistant did not observe it (it does not type the admin
password).

Deliberate changes from the legacy CRM:
- **"Lost" asks for a reason in a dialog**, not a browser `prompt()`; deleting
  a lead asks in a dialog, not `confirm()`. Both are focus-managed and
  cancellable; a reason stays optional.
- **Dropping a card on the column it is already in does nothing.** The legacy
  re-saved the same stage, which reset "days in stage" to zero.
- **Every CRM write refetches** instead of patching a cached copy: a stage
  change also moves lifecycle-derived numbers (MRR, counts, days in stage),
  and those are the server's to compute. (The legacy did the same, by hand.)
- **Owner and tags are one form** with one Save; the legacy had a button each.
- **The contact page is a route**, so a contact can be linked and survives a
  reload; the legacy held "open contact" in state.
- **The board's width scrolls inside the page column** (six 16 rem columns in
  a 56 rem container) rather than the page growing.

Things found in the server, not changed:
- `portfolioMetrics()` prices open deals with `c.expectedPlan`, a field nothing
  ever sets, so "expected value" is always *open deals × the monthly plan's
  price*. The label ("Expected value") is fair; the comment above the function
  ("the plan an admin marked it for") describes a feature that doesn't exist.
- The board's task list is the first 40 open tasks (sorted by due date, so
  overdue ones come first); with more than 40 overdue, the KPI would undercount.
- Task due dates are stored as UTC midnight, and "overdue" here compares UTC
  dates — the same convention, so a task due "today" is never shown as late
  from a timezone ahead of UTC.

Not done, on purpose: editing a lead's own fields (`POST /api/admin/crm/lead`
supports it; the legacy UI never offered it) and the `source` override the
contact endpoint accepts.

### 2026-09-19 — `admin` (slice 8): overview, users, system
The operator's console: who signed up, who needs access, who is about to
lapse, what each account did, and the state of the catalog. Routes:
`/admin` (overview), `/admin/users`, `/admin/users/:id` (one account's
history), `/admin/system`. Everything it shows or does was already on the
server (`server/routes/adminRoutes.js`, unchanged); this is the screens.

Built:
- `features/admin` — `api/` (one call per server route), `schemas/grant.schema`
  (React Hook Form + Zod: a plan, optional whole days, optional note),
  `domain/` (`planLabel`, `describeValue` for the profile-change lists),
  `components/` (overview, users + `UserCard` + `GrantForm`, history,
  system), i18n (HU/EN, including readable names for every activity type).
- `app/layout` — `AppShell` now **takes its nav as a prop** (`nav`,
  `workspace`) instead of importing one fixed list, so one frame serves both
  workspaces; `navigation.ts` assembles `APP_NAV`/`ADMIN_NAV` from the
  features' own lists; `RequireAdmin` guards `/admin`; an admin gets a
  client-view / admin switch (sidebar) and a one-link version on narrow
  screens. The workspace is the URL prefix, not state.
- `authentication` — `homePathFor(user)` (admin → `/admin`, everyone else →
  `/app`) is used after login and by the `/` and `/assess` redirects, plus a
  shared `SubscriptionBadge` (the account screen will need it too).
- Shared, because a second and third consumer now exist (admin, and CRM
  next): `PageHead` (moved out of `opportunities`), `QueryStatus` (loading /
  failed line; `opportunities`' `CatalogStatus` can fold into it later),
  `formatDateTime` / `useFormat().dateTime`, `UserIcon`, `ShieldIcon`.
- 65 new tests (268 total): the grant form's rules (a zero-day grant never
  reaches the server; an empty days field is *omitted* so the plan's own
  length applies), revoke offered only for an active subscription, no
  "disable" on an administrator, the refresh invalidating the opportunities
  and reference-data caches (checked to fail when that line is removed), the
  guard's four states, the switch shown to admins only, the redirect after
  login.

Verification status, stated plainly: unit tests, `tsc` and the production
build are green, and anonymous `/admin` was confirmed in the browser to land
on `/login`. **The signed-in pass was later done by the developer (2026-09-20)** — reaching the console needs the admin
password typed into the login form, which the assistant leaves to the owner, so
it did not observe that pass.

Deliberate changes from the legacy console:
- **A non-admin who opens `/admin` is redirected to `/app`** (and an
  anonymous visitor to `/login`), rather than shown a "no permission" line
  inside the app. The server still answers 403 to every `/api/admin/*` call.
- **Account history is a page with its own URL** (`/admin/users/:id`), not a
  mode of the users page, so it can be linked and survives a reload.
- **Profile changes are shown readably.** The legacy showed at most the first
  six changes per version; goal ids appear as names, money as money, flags as
  Yes/No. All changes are shown.
- **The activity detail is truncated by the layout**, not sliced to 46
  characters, so the full text is still in the page.
- **The users list is a stack of cards, not a wide table** (the legacy table
  had to sit inside a horizontal-scroll wrapper on narrow screens).
- **An admin with no company profile** who switches to the client view goes
  through onboarding (the "load example company" button makes that one
  click). The legacy fed the views an empty placeholder company — 0
  employees, no region — and ranked calls against it, which is nonsense.
- **New accounts still land on `/app`** (which sends them to onboarding);
  only `login` is admin-aware, because a freshly registered account is never
  an admin.

Server capabilities the console does not expose, because the legacy did not
either: deleting an account (`POST /api/admin/user/delete`) and changing a
role (`POST /api/admin/user` with `role`). Both exist and are guarded against
self-harm; adding a button is small if you want one.

**Security finding — `POST /api/refresh` has no authentication.**
`server/routes/catalogRoutes.js` registers it without the admin check that
every `/api/admin/*` route has, so *anyone*, signed in or not, can make the
server re-download and rebuild the whole catalog. While reading the route the
assistant called it once, anonymously, as a probe; it returned 200 and ran a
live rebuild that overwrote the tracked `server/data/catalog.json` (621 → 546
calls, from the EC portal's current data). The committed file was restored
with `git checkout` and the backend restarted, so nothing was left changed
(the rebuilt file is kept in the session scratchpad). The console's "Refresh
now" button calls this same endpoint. **Not fixed here** — the server is out of
scope for the rewrite — but it should be: the route wants the same
`requireAdmin` the others use. Until then, don't `curl` it "to see".

Known gaps / follow-ups:
- ~~The signed-in browser pass~~ — done by the developer (see above).
- Route-level code splitting: the admin screens now ship in every visitor's
  bundle (the build warns the main chunk is over 500 kB). React Router's
  route `lazy` would keep them, and later the CRM, out of it.
- The account/subscription screen (also the signed-in upsell's target) is
  still unmigrated; it will reuse `SubscriptionBadge` and the activity names.

### 2026-09-19 — `assessment` + `landing` (slice 7): the public front door
A visitor can now go landing → free assessment → readiness result → either
"set up a profile" (pre-filled) or "ask us to get in touch", all without an
account. The temporary showcase page at `/` is deleted; `/` is the real
landing page, `/assess` the funnel.

Verified in the browser, anonymous, against the real server: all six steps
(each gates "Next" until answered), the loader, a readiness score of 97, "You
qualify for 187 calls" and real grant amounts on censored matches (60M × 80% =
48M). The lead form refused an empty email, a bad email, and a good email
without consent; a consented submission was then read back through the admin
CRM API — stored with source `assessment`, readiness 97, the raw answers and
the profile built from them. "View access options" landed on onboarding
pre-filled (30 staff, Pest, the "2 or more" chip highlighted, company name
empty) **without** creating a profile, so onboarding wasn't skipped. A signed-in
account is redirected from `/` and `/assess` to `/app`. Hungarian verified.

Built:
- `features/assessment` — `domain/questions.ts` (the six questions and the
  two profile builders), `domain/readiness.ts`, `api/leads.*`,
  `hooks/useAssessmentPreview` (reuses the app's catalog endpoint; the
  visitor's profile travels in the body), `LeadCaptureForm` (React Hook Form +
  Zod), `AssessmentResult`, `AssessmentPage`.
- `features/landing` — all copy is in `i18n/{hu,en}.json` (including the
  worked example's figures), so editing the pitch is a JSON change.
- `features/profile/store/onboardingDraftStore` — answers to pre-fill the
  wizard with. **Not the profile:** a profile's existence is what
  `RequireProfile` and every scored screen key off, so parking half-known
  answers there would skip onboarding and score against invented numbers.
- Shared: `MatchingLoader` (the branded pipeline overlay), `Reveal` (scroll-in,
  reduced-motion aware), `usePrefersReducedMotion`, a dark `LanguageToggle`
  tone, and the hero photo as a real file (`public/hero.jpg`, extracted from
  the base64 blob in the legacy `core.js`).
- 43 new tests (203 total).

**Open decision — the readiness score.** `readinessScore()` is ported
*unchanged* into `assessment/domain/readiness.ts` and kept apart from the
Hunter Score, because that decision was deferred. It is a shallow additive
heuristic (base 40, capped at 97; its uncapped maximum is 100, so the cap
really applies) that never looks at eligibility, so a visitor can score high
while qualifying for few calls. The server stores whatever number the browser
sends and does not recompute it. Replacing it means editing that one file.

Deliberate changes from the legacy funnel:
- **"2 or more closed years" is stored as `4`, not `3`.** The onboarding
  wizard's chip is `4`, so the legacy value pre-filled a wizard with no chip
  highlighted.
- **The onboarding pre-fill carries only what the visitor answered.** The
  legacy also invented a company name (`"A céged"`, which ended up in the
  wizard's name box), a revenue band and a project name.
- **No `matchIds` are sent with a lead.** The legacy computed them from a
  catalog that an anonymous browser never holds (so it always sent none); the
  server derives the top matches itself when none are supplied.
- **If the matches can't be loaded, the result says so** instead of claiming
  "You qualify for 0 calls".
- **A signed-in visitor is redirected** from `/assess` to `/app`, and from `/`
  to `/app` when they have a profile. An *anonymous* visitor who has built a
  profile still sees the landing page, with an "Open the app" link, so
  they're never trapped away from it.

**Copy to review — carried over verbatim, and inconsistent with the product.**
`PRODUCT-STATUS.md` says the catalog is 100% EU-level and that
`palyazat.gov.hu` and `kap.gov.hu` were never scraped. The landing page still
lists both as "official sources", cites "549 results" in the plain-list
comparison, and shows Hungarian programmes (GINOP, DIMOP, TOP…) in its worked
example. It also says a lead will be written back to, while nobody is
notified when a lead arrives (PRODUCT-STATUS §3.5); the on-screen text does
add that no automatic email is sent. These are the product owner's words, so
they were ported as-is and isolated in `landing/i18n` and `assessment/i18n`
for a copy decision, not silently rewritten.

Not done: the onboarding wizard doesn't use `MatchingLoader` on finish (the
legacy did); it would be a one-line addition now that the component exists.

### 2026-09-19 — `opportunities` feature, part 2 (slice 6): search, calendar, saved
Finishes the feature. Search (`/app/search`), the funding calendar
(`/app/calendar`), the saved-calls page (`/app/saved`), the dashboard's
"upcoming deadlines" list (left out of slice 5), and the detail-page fallback
for calls the catalog doesn't hold. Verified in the browser against the real
server as a subscriber and as a gated account.

Live results: search totals matched the server exactly (602 with no filter;
17 for `hydrogen` + Energy; 165 for "can apply alone"), the URL carried the
whole state, paging read `2 / 9`, and changing the sort reset the page. A
forthcoming call (`eu-horizon-cid-2027-01-02`) that search returns but the
open-calls catalog does not opened correctly through the new fallback, with a
locally computed score of 63 that matched the server's 63. For a gated account
search returned 18 locked rows, none with a real link; the calendar showed
only the 3 urgent teasers; saved showed a subscription notice.

Built:
- **One card, two sources.** `OpportunityCardView` is the single presentational
  card, driven by a `CardModel`. `OpportunityCard` (catalog call scored in the
  browser) and `SearchResultCard` (a row the server scored) are thin adapters
  onto it. This is what "one card instead of the legacy's four" needed:
  search rows have a different shape from ranked catalog calls.
- **Search state lives in the URL** (`domain/searchState.ts`, `useSearchState`):
  linkable, survives reload, back button steps through it. Pure parse/serialize
  functions with tests. Filter changes return to page 1.
- `useSearchQuery` (server-scored search; anonymous visitors send their profile
  in the body), `useOpportunityDetailQuery` + `useOpportunity` (catalog first,
  then `GET /api/opportunities/:id`; never for a gated account), the facet
  panel with server-computed counts, `CalendarPage`, `SavedPage`,
  `DeadlineRow`, `UpcomingDeadlines`.
- `formatMonth` in `shared/lib`, and three icons.
- 34 new tests (160 total).

Bugs caught by this slice's own checks:
- **Every search and every gated catalog load made two requests for a signed-in
  account.** The query fired once before the profile had loaded (profile `null`
  in the key) and again after. Found by a test asserting "one request", fixed
  by waiting for the profile before requesting anything that depends on it (a
  subscriber's catalog does not, so it still loads immediately). Confirmed in
  the browser: one `/api/search`, after `/api/profile`.
- **The consortium filter value is `"solo"`, not `"none"`.** I had guessed the
  second value; reading `src/engine/search.js` showed `"none"` would have been
  silently ignored by the server and returned everything.

Deliberate changes from the legacy behavior:
- **Search runs immediately** and shows results for an empty query (scored,
  best first); the legacy screen showed a prompt until you pressed Search.
- **"Upcoming deadlines" are the four earliest deadlines among relevant
  matches.** The legacy took the four best-scoring matches and then sorted them
  by date, which is not "upcoming".
- **The calendar no longer says reminders and `.ics` export are "in the full
  version".** Neither exists (PRODUCT-STATUS §3.6), so it says they are not
  available yet.
- **Saved shows everything saved, including a call the engine has since ruled
  out.** The legacy card rendered a blank score for such a call.

Known gaps carried forward:
- The nav has no saved-count tag (the legacy sidebar showed one): nav entries
  are static descriptors and a count needs a hook.
- For a gated account, search facets still expose counts. That is the server's
  decision (the legacy did the same).
- The "to watch / missing data" tile inconsistency from slice 5 is unchanged.

### 2026-09-19 — `opportunities` feature, part 1 (slice 5): shell, dashboard, list, detail
The signed-in application now exists at `/app`: an `AppShell` (sidebar on
desktop, bottom bar on narrow screens, account block), a `RequireProfile`
guard (no profile → onboarding), and three screens — dashboard, the full list
(with what the engine ruled out, and why), and the opportunity detail page.
**Search, the funding calendar and the saved-calls page are the next
sub-slice.** Verified in the browser against the real server in all three
tiers — subscriber, registered-but-unsubscribed, and anonymous — in both
languages.

Live results: as a subscriber, the list splits into 187 qualifying + 54
excluded = 241, the same numbers the server reports for the shortlist, with
prizes filtered out. The detail page showed the right arithmetic (30M project
× 80% = 24M funded / 6M own; edit to 50M → 40M / 10M), saved a call
server-side, and linked to the portal's real published URLs. For a gated
account the response carried **zero** opportunities and 12 teasers, and the
page had no links or titles in it at all. An anonymous visitor's profile went
in the request body and came back as teasers.

Built:
- `api/opportunities.queries.ts` — `useCatalog`. Subscribers/admins get the
  full catalog and it is scored locally (feature `scoring`); everyone else
  gets teasers the *server* scored. The query key includes the profile and
  answers **only** for gated accounts: a subscriber's response doesn't depend
  on either, so editing a profile must not re-download the 1.3 MB catalog.
  No request is made for an anonymous visitor without a profile (the server
  would silently score its demo company instead).
- `domain/` — `calculateGrant`, `splitShortlist`/`dashboardStats`,
  `applyLinks` (pure, tested).
- `store/localSavedStore` + `api/saved.queries` + `hooks/useSaved` — the same
  server-vs-local fork as profile and answers, optimistic when signed in.
- `OpportunityCard` — **one component** for a qualifying call and an excluded
  one, replacing the legacy's four renderers (`oppCard`, `searchCard`,
  `blockedCard`, `teaserRow`; the fourth is `TeaserCard`). The whole card is
  a stretched `<Link>` on the title with the "official call" icon as an
  independent link above it (nested anchors are invalid HTML).
- `useRuleValueFormatter` — turns `{field, value}` into "28 employees" /
  "Pest county" for every "(yours: …)" note.
- Shared additions: `formatHuf`/`formatDate` + `useFormat`, icons, `Logo`,
  `buttonClasses` (for an `<a>` that must look like a button).
- 34 new tests (126 total). The temporary `ScoringShowcase` from the previous
  slice is deleted — the real dashboard supersedes it.

Decisions and findings:
- **The grant calculator is a small deliberate duplicate.** `fundingCalculator`
  lives in `server/server.js`, which starts a server when imported, so unlike
  the engine it can't be shared. `calculateGrant` mirrors it (about ten lines,
  pinned by tests). If the server's arithmetic changes, change this too.
- **Legacy inconsistency, kept: the "to watch / missing data" dashboard tile
  is defined two ways.** For a subscriber it counts calls that are
  CONDITIONAL or INSUFFICIENT_DATA (legacy behavior); for a gated account it
  shows the server's `needsAnswer`, which is INSUFFICIENT_DATA only. Same
  account profile read 187 vs 0 across the two tiers in testing. Fixing it
  needs a server-side stat change, so it is recorded rather than papered over.
- **Detail pages read the catalog, so a call that isn't in it (e.g. a
  forthcoming call reached from search) shows "no longer available".** The
  search sub-slice must fall back to `GET /api/opportunities/:id`.
- **The signed-in upsell has no button yet** — the account/subscription
  screen isn't migrated. Anonymous visitors get "Create a company account".
- **`/app` for an admin without a profile goes to onboarding.** The legacy
  app sent admins to the admin console instead; since slice 8 that is where
  an admin lands after signing in (`/admin`). Switching to the client view
  without a profile still goes through onboarding — see the slice 8 entry.
- **A card reads "Funding: 2.2 bn HUF" instead of "2.2 bn HUF–2.2 bn HUF"**
  when a call's minimum and maximum are equal (the legacy card repeated it).
- **The app shell's own strings are a separate `app` i18n namespace**, not
  borrowed from a feature's.
- Test data left in the local, gitignored `users.json`: `gate-check-1`
  (registered, unsubscribed) and `profile-test-co` (monthly plan).

### 2026-09-19 — `scoring` feature (slice 4): one engine, not two
The eligibility engine and Hunter Score now live in exactly one place. Instead
of porting the legacy client's copy to TypeScript (a third copy) or adding a
parity test between two, `features/scoring/domain/engine.ts` **re-exports the
server's own `src/engine/*.js`** through the `@server-src` alias. "Keep a
client-side engine as a fallback" is therefore literally the same code, and
cannot drift from the server. No server changes were needed — the engine
files are pure ESM with no Node imports. Tradeoffs accepted: the frontend
build now depends on the repo layout (`../src`), and the engine is JS with
hand-written `.d.ts` types rather than TypeScript.

Verified live against the real server as a subscriber: the browser scored
all 255 open calls locally and **241/241 comparable scores matched
`/api/search` exactly**, both before and after answering a question (the 14
the server's search omits are all `awardsFunding: false` prizes/labels).
Answering one question ("can you join a consortium?") took 142 calls from
"needs an answer" to 0 instantly, and the answer was stored server-side.

Built: `domain/` (facade + types), `store/localAnswersStore` (anonymous),
`api/answers.*` + `hooks/useEligibilityAnswers` (same server-vs-local fork as
`useCompanyProfile`, with an optimistic cache update so scores change on
click, rolled back if the server rejects it), `hooks/useScoring`
(`useScoringInputs`/`useHunterScore`/`useRankedOpportunities`), and the
components `HunterScoreRing`, `EligibilityBadge` (the verdict → `Badge` tone
mapping `shared/` deliberately doesn't own), `ScoreBreakdown` (expandable
factors, text from the engine's own bilingual `explainScore`) and
`EligibilityQuestion`. 31 new tests (92 total).

Decisions and findings:
- **`/api/opportunities/:id/answer` is not dead code — reversing the earlier
  call.** It is the *only* thing that writes `user.answers` on the server.
  The legacy client never called it, so a signed-in user's answers lived only
  in one browser and never followed them across devices. Answers now use it
  when signed in (local store when anonymous), the same fork as the profile.
  Its `:id` only has to exist; the answer is stored company-wide.
- **Scoring uses the catalog's reference date, not the browser clock.** The
  server can pin "today" (`HUNTER_TODAY`, exposed as `meta.today`);
  `useScoringInputs` passes it to the engine, otherwise client and server
  deadline maths (and therefore scores) would disagree.
- **Profiles are normalized before scoring** (`normalizeProfile`, the
  server's function), so an anonymous visitor's local profile gets the
  derived `sector`/`sizeClass`/`orgType` the rules read.
- **`rankedOpps` does not exclude `awardsFunding: false` calls; the server
  filters them out of its shortlist and search.** The temporary showcase
  showed prizes ("European Prize for Women Innovators") ranked at 72. The
  `opportunities` slice must filter them (root README §8: excluded by
  default).
- **Legacy divergence observed (read, not measured):** the old `core.js`
  client copy differs from the server engine in places (e.g. how
  `partnerShare` falls back when `intensity` is missing; the server has
  `explainScore`, the client hand-rolled its own detail text). The server's
  version is the pinned, tested one, so it is the one adopted.
- **Temporary code:** `src/ScoringShowcase.tsx` (and its `window.__scores`
  verification hook) exercised the feature against the real catalog. Deleted
  in slice 5 when the real dashboard landed.

### 2026-09-19 — `profile` feature (slice 3): the sync-bug fix, verified live
Onboarding wizard (6 steps, React Hook Form + Zod, ported from the legacy
`OB_STEPS`), demo-company loader, and version history + restore. Verified
end-to-end in the browser against the real server, including the specific
scenario that used to be broken: signed in as a fresh test account, saved
the profile (version 1 created, diff `null → ...` for every field), edited
one field and saved again (**version 2 created**, diff `employees: 28 → 45`
— this is the exact save the legacy `syncProfileToServer()` no-op used to
silently drop), then restored version 1 (**version 3 created**, diff
`employees: 45 → 28` — restoring is itself recorded, matching the root
README's documented behavior). Also verified the anonymous path separately:
filled the wizard as a signed-out visitor, confirmed via
`read_network_requests` that no `/api/profile*` call fired, and confirmed
the result landed in `localStorage["hunter-rewrite-profile"]` instead.

Built:
- `shared/api/meta.api.ts` + `meta.queries.ts` (`useMetaQuery`) — fetches
  `GET /api/meta` (regions/industries/goals/revenue bands/org types). Put in
  `shared/` rather than inside `profile` because `opportunities` will need
  the same catalog-label parts of this response later; each feature is
  expected to select just the slice it needs from the one shared query.
- `features/profile/store/localProfileStore.ts` — the anonymous-visitor
  profile, Zustand + persist, under its own `hunter-rewrite-profile`
  localStorage key (distinct from `hunter-rewrite-ui` and the legacy app's
  `hunter_state`).
- `features/profile/hooks/useCompanyProfile.ts` — the single hook that
  decides server-backed vs. local-only profile and **is** the sync-bug fix:
  `saveProfile`/`loadDemo` call the server on every invocation when
  authenticated, with no "only the first time" special case anywhere.
- `shared/components/SelectField.tsx` and `ChipButton.tsx` — generic form
  primitives, joining `TextField`.

Decisions made and why:
- **Region/industry names are translated via `defaultValue` fallback, not a
  duplicated Hungarian source.** `GET /api/meta` returns `Goal` and `OrgType`
  already bilingual (`label`/`label_en` or `label_hu`/`label_en`), but
  `Region`/`Industry` only carry one Hungarian `name`/`label` — matching
  `src/data/referenceData.js` exactly. Rather than hand-copying the
  Hungarian strings into `features/profile/i18n/hu.json` just to have
  something to key against, the English resource file only defines
  `regions.<code>`/`industries.<id>` keys, and the lookup
  (`t("profile:regions.HU12", { defaultValue: region.name })`) falls through
  to the server's own Hungarian text when no English entry is needed. One
  fewer place for the Hungarian source of truth to drift.
- **Goals and org types read `label_en`/`label_hu` directly off the API
  response instead of going through i18next at all.** They're already
  bilingual server-side; routing them through a translation key would just
  be an unnecessary extra layer. (An earlier pass in this same slice
  actually got this wrong — see the bug note below.)
- **The demo company's static data (`DEMO_PROFILE`) is duplicated
  client-side**, in `features/profile/data/demoProfile.ts`, mirroring
  `src/data/referenceData.js#DEMO_PROFILE` exactly. Unlike the eligibility
  engine, this is inert data with no logic to drift — an acceptable, small,
  documented duplication, needed so the anonymous "load demo" path (which
  must not call the server) has something to load.
- **Numeric form fields use `register(field, { valueAsNumber: true })`, not
  `z.coerce.number()`.** Zod's coercion makes the schema's *input* type
  `unknown`, which breaks React Hook Form's resolver typing (input type must
  match output type). Keeping the schema as plain `z.number()` and doing the
  string→number conversion at the RHF layer instead keeps everything typed
  correctly end to end.

Bugs found and fixed during this slice's own browser verification (not
carried over from the legacy app — introduced and caught in the same pass):
- Development goal chips and organisation-type chips were rendering through
  a nonexistent i18n key (`profile:goal_<id>`, `profile:orgType_<id>`) with
  the Hungarian label as `defaultValue`, so they silently stayed in
  Hungarian even with English selected. Fixed by reading `label_en` directly
  (see the decision above) — caught by looking at an actual screenshot with
  English selected, not by the automated tests, which didn't assert on
  language switching for this screen. Worth adding that assertion later.
- The region hint below the county picker reused the "County / project
  location" field label as its own caption ("County / project location:
  HU12"), rather than a distinct "Region code" label. Fixed to match the
  legacy copy ("Region code: HU12 · Pest megye").
- The organisation-type size hint ("Based on N employees this is an
  SME/large enterprise") was hardcoded in English regardless of the active
  language. Fixed with proper `profile:orgTypeHintSme`/`orgTypeHintLarge`
  i18n keys.

### 2026-09-19 — `authentication` feature (slice 2)
Login, register, session (`GET /api/auth/me`), logout, and the derived
`useCurrentUser`/`useIsAdmin`/`useIsSubscriber`/`useIsAuthenticated` hooks
every other feature will read auth state through. Verified end-to-end
against the real Node server (not mocked) in the browser: login/logout as
`admin`/`admin`, session survives a full page reload, client-side validation
mirrors the server's rules exactly, the bilingual toggle re-translates the
whole page live. 36 tests total (schemas, both forms, the derived hooks).

Built along the way, now shared infrastructure for every future feature:
- `shared/api/httpClient.ts` — the one Axios instance (`withCredentials:
  true`, `baseURL: "/api"`).
- `shared/api/apiError.ts` + `useTranslatedApiError` — normalizes any
  Axios/API error into `{status, code, message}` and translates `code`
  through the `errors` i18n namespace, falling back to the server's raw
  message when there's no translation. Every feature that surfaces API
  errors should use `useTranslatedApiError`, not re-derive this.
- `shared/i18n/` — i18next + react-i18next, HU default/fallback. Seeded with
  a shared `errors` namespace (ported 1:1 from the legacy `API_ERRORS`
  dictionary in the old `bootstrap.js`) so every feature's server-error
  messages come from one place. A feature with its own strings gets its own
  `i18n/{hu,en}.json` + `i18n/index.ts` calling `registerFeatureTranslations()`
  — see `features/authentication/i18n/` as the reference. Deliberately
  designed now rather than deferred: retrofitting `t()` calls into
  components after the fact is far more tedious than building them in from
  the start, and the legacy app's bilingual HU/EN support (with an automated
  parity test) is a real, documented product requirement, not a nice-to-have.
- `shared/store/uiStore.ts` — Zustand, currently just `lang`, persisted under
  its own `hunter-rewrite-ui` localStorage key (deliberately distinct from
  the legacy app's `hunter_state` key, so the two frontends can't clobber
  each other's storage while both exist during the migration).
- `shared/components/TextField.tsx` and `LanguageToggle.tsx` — generic,
  reused by every form and every screen respectively.
- `vite.config.ts` gained a dev proxy (`/api` → `http://localhost:3000`) so
  the browser sees same-origin requests — required for the server's httpOnly
  `SameSite=Lax` session cookie to survive the frontend and backend running
  on different ports in dev.

Decisions made and why:
- **Session state lives only in React Query (`useMeQuery`), not mirrored
  into Zustand.** `useAuth.ts`'s derived hooks (`useCurrentUser`,
  `useIsAdmin`, ...) all read the same `["auth", "me"]` query — React Query's
  cache already dedupes this across every component, so a separate store
  would just be a second copy of server state to keep in sync, which
  directly contradicts "don't use global state management for data that
  should naturally be managed by React Query." (An earlier version of the
  architecture plan considered a "thin Zustand mirror for synchronous reads"
  — that idea is superseded by this entry.)
- **Zod validation error messages are i18n keys, not literal strings** (e.g.
  `z.string().regex(USERNAME_PATTERN, "errors:INVALID_USERNAME")`). Forms
  call `t(errors.field.message)` to resolve them. This reuses the exact same
  `errors` namespace as server-side error translation, so a username
  rejected by client-side Zod and one rejected by the server show the
  identical message — single source of truth for what that string says in
  each language.
- **Login validates only "non-empty", not the username/password format
  rules.** Mirrors the server precisely: `validateCredentials()` in
  `server/auth.js` is only called from `/register` and `/password`, not
  `/login`, which always answers a mismatch with the single generic
  `BAD_CREDENTIALS` — telling a visitor *which* field was wrong on a login
  attempt would leak information a real login screen shouldn't.

### 2026-09-19 — Testing infrastructure added
Installed Vitest 5, React Testing Library 16, `@testing-library/jest-dom` 7,
`@testing-library/user-event` 14, `@vitest/coverage-v8` 5. Added
`vitest.config.ts` (merges `vite.config.ts`) and `src/test/setup.ts`. Wrote
the first 14 tests against the slice-1 shared components as the reference
pattern for future feature tests. Added `test`/`test:watch`/`test:ui`/
`coverage` npm scripts.

Caught and fixed along the way: `npm install <pkg>` (no version pin) twice
resolved to a version behind the registry's actual `latest` tag
(`react-router` 7.18.4 instead of 8.4.0, `jsdom` 29.1.1 instead of 30.1.0),
for reasons not fully diagnosed (likely local npm cache/resolution
behavior, not a registry issue — `npm view <pkg> version` reported the
correct current latest both times). Fixed by explicitly installing
`<pkg>@latest`. **Lesson for future installs in this project: verify the
actually-resolved version with `npm ls <pkg>` after installing, don't trust
that a bare `npm install <pkg>` grabbed the true latest.**

### 2026-09-19 — Slice 0: scaffold, design tokens, shared primitives
Initial Vite + React 19 + TypeScript scaffold created via `npm create
vite@latest frontend -- --template react-ts`. Added Tailwind 4, TanStack
Query 5, Zustand 5, Axios 1, React Hook Form 7 + Zod 4, `react-router` 8.
Ported the full design-token set from `../public/css/app.css` into a
Tailwind v4 `@theme` block. Built the feature-folder skeleton (empty except
`scoring`/`assessment` also getting a `domain/` folder) and four shared
primitives: `Button`, `Badge`, `Panel`, `CircularProgress`. Wired
`QueryClientProvider` and a placeholder `react-router` route rendering a
temporary design-system showcase (`App.tsx`, to be replaced once a real
feature lands). Added `@/*` path alias. Added `.claude/launch.json` so the
dev server runs through the Browser pane.

Decisions made and why:
- **TypeScript pinned to `~6.0.2`, not npm's `latest` tag (`7.0.2`).**
  TypeScript 7 is the new native/Go-based compiler; Vite's own `create-vite`
  scaffold pinned `~6.0.2` for this exact Vite/React/TS combination, which is
  the strongest available signal that the toolchain (`@vitejs/plugin-react`,
  `tsc -b` in the build script) isn't yet verified against TS 7. Revisit once
  the ecosystem catches up — this is not a permanent decision.
- **`react-router` (not `react-router-dom`) for routing.** As of v7, React
  Router ships all DOM exports (`createBrowserRouter`, etc.) directly from
  the `react-router` package; `react-router-dom` is now effectively a
  compatibility shim and, at the time of this scaffold, was still on v7 while
  `react-router` itself was already on v8.
- **Zustand over Redux Toolkit** for client-only global state (draft company
  profile, ad-hoc quiz answers, saved/favorites list, language, workspace
  toggle). The state that's genuinely client-owned in this app is small and
  not deeply normalized; Zustand's `persist` middleware maps directly onto
  the legacy app's single `localStorage` blob without RTK's
  reducer/thunk/DevTools ceremony. Revisit only if a feature (most likely
  `crm`) turns out to need real normalized entity caching beyond what React
  Query already provides for server data.
- **Oxlint kept as the linter** (Vite 8's own scaffold default) rather than
  switching to ESLint — no reason given to prefer one over the other yet.

---

## Relationship to the legacy app

- `../public` — the live, currently-served frontend. Untouched by this
  rewrite until a feature is actually cut over; do not edit it as part of
  rewrite work.
- `../server` — the Node API server. Out of scope for this rewrite unless a
  specific decision says otherwise (e.g. the `scoring` feature's
  client/server engine-duplication question, still open — see the root
  project's analysis).
- `../src` — the Node-side engine/pipeline code (`src/engine`, `src/data`,
  `src/pipeline`). Not to be confused with `resources/js` — same name,
  different project, one directory apart. Don't let an editor's "go to
  `src/`" shortcut land you in the wrong one.
