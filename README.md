# Hunter — Frontend (rewrite)

This is the in-progress React rewrite of Hunter's frontend. It replaces the
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
| `authentication` | not started |
| `profile` (onboarding + version history) | not started |
| `scoring` (eligibility engine + Hunter Score) | not started |
| `opportunities` (dashboard/list/detail/search/calendar/saved) | not started |
| `assessment` (free readiness funnel + lead capture) | not started |
| `admin` | not started |
| `crm` | not started |
| `hunter-plus` (demo) | not started |

Nothing here is wired up to the real Node server or served to real users yet.
`../public` remains the live app until a feature is actually cut over.

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
| Forms | React Hook Form + Zod | 7.88.x / 4.6.x | Zod also used to validate API responses at the boundary, not just form input |
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
├── app/            # router, providers (QueryClient, etc.), shell/layout composition
├── features/       # one folder per bounded piece of product functionality
│   └── <feature>/
│       ├── components/   # feature-owned UI
│       ├── hooks/         # feature-owned hooks (business logic lives here, not in JSX)
│       ├── api/           # feature-owned Axios calls + React Query hooks + query-key factory
│       ├── types/         # feature-owned types
│       └── domain/        # (scoring, assessment only) pure business-rule functions
└── shared/         # genuinely cross-feature only — see rule below
    ├── components/  # generic, domain-free UI atoms (Button, Badge, Panel, CircularProgress, ...)
    ├── hooks/
    ├── api/          # the Axios instance + typed ApiError mapping
    ├── lib/
    ├── i18n/
    └── types/
```

**Feature list and dependency direction** (no cycles — a feature only depends
on the ones listed before it):

```
authentication → profile → scoring → opportunities → assessment → hunter-plus
                                                     ↘ hunter-plus
authentication → admin
authentication, profile, opportunities → crm (read-only)
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
   does not contain feature logic. Each feature should be able to describe
   its own routes/nav entry without `app/` importing its internals.

---

## Path alias

`@/...` resolves to `src/...` (configured in both `vite.config.ts` and
`tsconfig.app.json` — keep them in sync if this ever changes).

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

**What's covered so far:** the four shared primitives
(`Button`/`Badge`/`Panel`/`CircularProgress`), 14 tests, all passing. No
feature code exists yet to test.

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # run the test suite once
npm run test:watch # watch mode
npm run lint        # oxlint
npm run build       # tsc -b && vite build
```

---

## Decisions & changes log

Newest first. Each entry says what changed, why, and what it affects — the
things that would otherwise only live in a chat transcript.

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
  `src/pipeline`). Not to be confused with `frontend/src` — same name,
  different project, one directory apart. Don't let an editor's "go to
  `src/`" shortcut land you in the wrong one.
