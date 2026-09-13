# HUNTER

**Funding intelligence for Hungarian companies.**

Hunter answers one question for a Hungarian company: *of everything currently
open, which calls could we actually win, and why?*

It ingests the European Commission's live opportunity data, screens every call
against a structured company profile with a deterministic rule engine, and ranks
what survives. The engine filters; it never guesses — when a required fact is
unknown it asks rather than assumes.

```bash
npm run refresh     # scrape the portals and build the catalog  (~2 min)
npm start           # http://localhost:3000
```

---

## 1. What the system does

| | |
|---|---|
| **Catalog** | ~590 real calls — 321 open, 267 forthcoming — refreshed from the live portal every 6 h |
| **Sources** | EU Funding & Tenders Portal (SEDIA) and Kohesio — the two scrapers in `scraping data/` |
| **Search** | Full-text BM25 over the whole catalog, with facets, filters and pagination |
| **Screening** | Deterministic rule engine, four verdicts, every exclusion explained |
| **Ranking** | Hunter Score — five weighted factors, each with a written justification |
| **Benchmarks** | 400 funded Hungarian projects from Kohesio, as real-world comparables |
| **Accounts** | Sign-up and sign-in; admin-granted subscriptions, no payment gateway yet |
| **History** | Every profile save versioned with a diff, plus a per-account activity log |
| **CRM** | Sales pipeline, contact records, notes and follow-ups, captured assessment leads, MRR/ARR and conversion — all derived from recorded facts |
| **Languages** | Hungarian and English, switchable at runtime |

Everything runs on Node's standard library and Python's `requests`. There is no
build step, no framework and no database — see [§6.4](#64-does-this-need-a-database)
for why a database would be the wrong answer for the catalog.

---

## 2. Why an EU-wide catalog

The brief was opportunities *available to Hungarian companies*, at any scale.
Hungary is an EU Member State, so a Hungarian legal entity is an eligible
applicant across every Union programme — Horizon Europe, Digital Europe, LIFE,
CEF, EDF, I3, CERV and the rest. Nationality is therefore almost never the
deciding factor. What actually decides it is:

1. **Organisation type** — many calls are open only to public bodies, NGOs or
   research organisations, and a company is simply not an eligible applicant.
2. **Consortium requirement** — most Horizon calls need at least three
   independent organisations from three different Member States. This is the
   single largest practical barrier for a Hungarian SME, and the field that
   changes the result set most.
3. **Project scale** — a single-applicant call with a €5M floor is out of reach
   for a 30M HUF project; the same €5M inside a consortium is not.
4. **Theme** and **deadline**.

The engine models all four explicitly. That is the part that turns 600 calls
into a shortlist a company can act on.

### Where the data comes from, exactly

Both scrapers in `scraping data/` are used in full, and they target:

- `api.tech.ec.europa.eu` — the Commission's SEDIA search API behind the EU
  Funding & Tenders Portal
- `kohesio.ec.europa.eu` — funded cohesion-policy projects

**Neither targets `palyazat.gov.hu`**, and no data in this project was scraped
from it. Every call in a hosted catalog comes from the portal above.

The nine Hungarian entries in [src/data/mockGrants.js](src/data/mockGrants.js)
are **not scraped and not new** — they are the original prototype's hand-authored
demonstration data, which arrived inline in `index.html`. They are marked
`curated: true`, they are **excluded from the catalog by default**
(`HUNTER_INCLUDE_CURATED=false`), and where shown they identify themselves as
reference entries rather than portal records.

They are kept for two reasons: they are what the pinned regression test scores
against, and they exercise the path a real national connector would use. Adding
`palyazat.gov.hu` later means writing one normalizer that emits the same shape —
[src/pipeline/adaptNational.js](src/pipeline/adaptNational.js) is the seam.

At the time of writing `palyazat.gov.hu` and `szechenyiterv.gov.hu` do not accept
connections at all (DNS resolves, TCP fails), so there is nothing to scrape yet.
`kap.gov.hu` *is* up — it is Drupal 10 with JSON:API disabled, so its call
schedule would need HTML scraping of a roadmap page rather than a call database.
Worth doing, but a separate piece of work.

---

## 3. Architecture

```text
 Seeding (Python, once)          Runtime (Node, continuous)
 ──────────────────────          ──────────────────────────
 funding_tenders_scraper ─┐
 kohesio_scraper ─────────┤        ┌──────────────────────────────┐
                          ▼        │ server/refresh.js  every 6 h │
                    data/raw/*.jsonl        │                     │
                          │        │        ▼                     │
                          ▼        │  euTendersConnector ──► SEDIA│
              src/pipeline/buildCatalog.js  │  (HTTP, no Python)   │
                   normalizeEu.js  │        │                     │
                   taxonomy.js     │        ▼  atomic swap        │
                   programmes.js   └──► server/data/catalog.json ─┘
                                              │
                                              ▼
                                       server/server.js
                                         ├── BM25 index (in memory)
                                         ├── rule engine + scoring
                                         └── REST API ──► index.html
                                                              │
                              anonymous → localStorage · signed in → server/store.js
```

The expensive work — network, HTML stripping, thematic classification — happens
once at build time. The server loads the result, indexes it, and answers every
request from memory.

### Files

| Path | Role |
|---|---|
| [src/data/programmes.js](src/data/programmes.js) | Funding rate, consortium size and eligible applicant types for 58 EU action types |
| [src/data/taxonomy.js](src/data/taxonomy.js) | Maps call text onto Hunter's goal and sector vocabulary |
| [src/pipeline/normalizeEu.js](src/pipeline/normalizeEu.js) | Raw SEDIA record → Hunter opportunity, with generated rules |
| [src/pipeline/kohesioBenchmarks.js](src/pipeline/kohesioBenchmarks.js) | Funded Hungarian projects → benchmark statistics |
| [src/pipeline/buildCatalog.js](src/pipeline/buildCatalog.js) | Merges every source into one catalog; fetches the live EUR/HUF rate |
| [src/engine/eligibility.js](src/engine/eligibility.js) | Deterministic rule evaluation, four verdicts |
| [src/engine/scoring.js](src/engine/scoring.js) | Hunter Score and per-factor explanations |
| [src/engine/search.js](src/engine/search.js) | BM25 inverted index, filters, facets |
| [src/engine/profile.js](src/engine/profile.js) | Derives what it can from the profile, leaves the rest unknown |
| [src/connectors/euTendersConnector.js](src/connectors/euTendersConnector.js) | Live SEDIA fetch over HTTP, no Python required |
| [src/pipeline/adaptNational.js](src/pipeline/adaptNational.js) | The seam a real Hungarian national connector would plug into |
| [server/refresh.js](server/refresh.js) | Scheduled self-refresh: atomic swap, sanity check, backoff |
| [server/auth.js](server/auth.js) | scrypt passwords, sessions, plans and subscription entitlements |
| [server/store.js](server/store.js) | Accounts, profile versions, subscription log, activity, CRM records and leads |
| [server/crm.js](server/crm.js) | Lifecycle, engagement, revenue and pipeline metrics — all computed, none stored |
| [server/server.js](server/server.js) | REST API and static hosting |
| [index.html](index.html) | The whole front end, one self-contained file |

---

## 4. The engines

### 4.1 Eligibility — deterministic, four verdicts

Rules are declarative `{field, op, value}` objects supporting seven operators
(`between`, `in`, `not_in`, `>=`, `<=`, `==`, `includes_any`). Each call carries
its own rules, so the same evaluator runs unchanged on the server and in the
browser.

| Verdict | Meaning |
|---|---|
| `ELIGIBLE` | All hard rules pass, no material conditions |
| `CONDITIONAL` | All hard rules pass, but conditions apply |
| `INSUFFICIENT_DATA` | A required field is unknown — the user is asked |
| `NOT_ELIGIBLE` | A hard rule fails; the call is excluded, with the reason shown |

Answers are stored **per company, not per call**. Answering *"yes, we can join a
consortium"* once resolves it for all 182 calls that would have asked:

```
before  →  eligible 253 · blocked 71 · shortlist 15 · awaiting an answer 182
yes     →  eligible 253 · blocked 71 · shortlist 22 · awaiting an answer   1
no      →  eligible  72 · blocked 252 · shortlist 16 · awaiting an answer   1
```

### 4.2 Hunter Score

```
Score = 0.35·Eligibility + 0.25·ProjectFit + 0.15·FundingSize
      + 0.15·Timing      + 0.10·Feasibility
```

The weights are the product specification and have not changed. What each factor
*reads* has been extended for EU data, and every extra signal is read only when
present — so the nine Hungarian reference calls score exactly as they did before
(the regression test in [tests/engine.test.js](tests/engine.test.js) pins them at
95 / 87 / 87).

### 4.3 Consortium economics

The portal publishes the grant **per project**. On a consortium call that money
funds the whole partnership, not the Hungarian applicant. Treating it as the
applicant's own budget excluded nearly every Horizon call from every SME — a
30M HUF project "failing" a 1.9bn HUF floor that it was never being measured
against.

So the pipeline distinguishes the two cases:

- **Single applicant** — the published contribution is what this company would
  receive, so its project must be able to absorb it. That is a **hard rule**.
- **Consortium** — the company delivers one work package. `partnerShare`
  estimates that slice (6% / 12% / 25% of the grant, capped at an even split),
  and it drives the **soft** rules, the FundingSize factor and the calculator.
  It is labelled an estimate everywhere it appears.

That single correction moved the demo company from 111 eligible calls to 253,
and turned the exclusion list from noise into real reasons — *"eligible
applicants: public, ngo"*, *"project size below the call's floor"*.

### 4.4 Thematic classification

EU calls describe themselves in prose; the company profile speaks a fixed
vocabulary of 23 development goals. [taxonomy.js](src/data/taxonomy.js) bridges
them with weighted term matching — a phrase in the title counts for more than the
same phrase in the scope section — and a goal must clear both an absolute
evidence floor and a share of the call's dominant theme.

Two calibration decisions, both made against the live corpus:

- A Commission cross-cutting tag (`AI`, `DigitalAgenda`) counts as supporting
  evidence, not proof, and each goal is credited for tags **once**. Without that,
  "digitalisation" attached itself to half of Horizon.
- Sectors are ranked, not collected, so an industrial heat-pump call does not
  surface as a tourism opportunity.

Result on the current snapshot: a mean of 2 themes per call, 26 of 335 open calls
genuinely unclassified, and a distribution that matches how EU funding is
actually spread (environment 23%, R&D 21%, digitalisation 19%, energy 15%).

### 4.5 Getting from a match to an application

Knowing a call fits is only useful if you can act on it, so every opportunity
carries the real destinations the portal publishes:

| Link | Coverage | What it is |
|---|---|---|
| `sourceUrl` | 593 of 602 | The official topic page — full text, annexes, FAQ |
| `submissionUrl` | 322 of 602 | Direct link that opens a draft proposal in the submission system (EU Login required) |

These come from the portal's own `url` and `links` fields; none are constructed
by pattern. A 12-call sample of `sourceUrl` was checked end to end — all 200.

In the interface they appear as a **How to apply** panel on the detail page, the
primary gold button (*Start the application* when the submission system is open,
otherwise *Open the official call*), and a small external-link icon on every
result card so the official page is one click away without opening the detail.

The nine Hungarian entries are `curated: true`. `palyazat.gov.hu` was
unreachable throughout development, so rather than sending anyone to a dead deep
link they show a panel saying they are curated reference entries and pointing at
the portal where the real calls get published. Only the EIC Accelerator entry
carries a real URL, because that page exists and was verified.

### 4.6 Search

BM25 over an in-memory inverted index, with field boosts (title ×6, identifier
×5, call id ×4, keywords ×3, body ×1), Hungarian accent folding and prefix
matching so `hydro` finds `hydrogen`.

Queries of three or more terms require at least half of them to match, which is
what stops a pasted topic identifier from returning every call sharing the token
`2026`. Facet counts are always computed over the filtered result set, so no
filter combination leads to a dead end.

---

## 5. Running it

### Prerequisites

Node 20+ and Python 3.8+ (`pip install -r "scraping data/scrapping data from ec.europa.eu funding-tenders/requirements.txt"`).

### Commands

| Command | What it does |
|---|---|
| `npm start` | Serve the app on `:3000`, refreshing itself every 6 h |
| `npm run dev` | Same, restarting on change |
| `npm test` | Full suite — 106 tests |
| `npm run refresh` | Scrape both portals and rebuild the catalog |
| `npm run build:catalog` | Rebuild from existing `data/raw/`, with a live EUR/HUF rate (add `--curated` for the demo entries) |
| `npm run scrape:open` | Open EU calls only |
| `npm run scrape:forthcoming` | Forthcoming EU calls |
| `npm run scrape:benchmarks` | Hungarian funded projects from Kohesio |

Environment variables: `PORT`, `HUNTER_TODAY` (pins the reference date for
deadline arithmetic), `HUNTER_DATA_DIR` (isolates the profile and catalog).

### Data hygiene

The portal lists 592 calls as "open", but 237 of them have deadlines in 2023 and
2024. Ingestion filters on the actual deadline rather than the status flag and
reports what it dropped:

```
EU open feed: { input: 563, expired: 237, unusable: 0, duplicate: 0, kept: 326 }
```

Grants are converted to HUF at the ECB daily reference rate, fetched at build
time and recorded in the catalog with its source; a pinned rate is the fallback
so a build never fails on a network hiccup.

---

## 6. Hosting

### 6.1 Keeping the data current

A hosted instance refreshes itself. Calls open and close every week, and a stale
catalog is worse than an empty one because it still looks authoritative.

[server/refresh.js](server/refresh.js) runs on a timer, pulling from the portal
over HTTP — **no Python needed on the host**. The Python scrapers stay the way to
seed a catalog and to pull the deep Kohesio benchmark data, which changes far too
slowly to refetch on a schedule.

```bash
HUNTER_AUTO_REFRESH=true HUNTER_REFRESH_HOURS=6 npm start
```

Three properties are deliberate, and each has a test:

- **Never serve a half-built catalog.** The new one is assembled completely, then
  swapped in with a single assignment.
- **Never lose the working catalog to a bad refresh.** A refresh that throws, or
  that returns suspiciously few calls — the portal does sometimes answer `200`
  with almost nothing — is discarded, the previous catalog keeps serving, and the
  error is recorded in `/api/health`. Failures back off exponentially (5 min → 2 h)
  and reset on the next success.
- **Never leave a truncated file.** The catalog is written to a temp file and
  renamed, so a crash mid-write cannot corrupt what the next boot loads.

| Variable | Default | Purpose |
|---|---|---|
| `HUNTER_AUTO_REFRESH` | `true` | Turn the scheduler off entirely |
| `HUNTER_REFRESH_HOURS` | `6` | Interval between refreshes |
| `HUNTER_REFRESH_ON_BOOT` | `false` | Refresh immediately at startup |
| `HUNTER_REFRESH_MAX_RECORDS` | `900` | Cap per status per cycle |
| `HUNTER_INCLUDE_FORTHCOMING` | `true` | Include upcoming calls |
| `HUNTER_INCLUDE_CURATED` | `false` | Include the nine demo entries (see §2) |
| `HUNTER_PERSIST` | `false` | Store one anonymous profile server-side — local dev only |
| `HUNTER_ADMIN_USER` | `admin` | Administrator username seeded on first boot |
| `HUNTER_ADMIN_PASSWORD` | `admin` | Administrator password — **set this before going public** |
| `HUNTER_SECURE_COOKIE` | `false` | Add `Secure` to the session cookie (set behind HTTPS) |
| `HUNTER_TODAY` | *today* | Pin the reference date |
| `HUNTER_DATA_DIR` | `server/data` | Where the catalog lives |

`GET /api/refresh` reports status; `POST /api/refresh` triggers one immediately.

### 6.2 Accounts, subscriptions and history

There are accounts now, so the product can be demonstrated the way it will be
sold: a company signs up, sees enough to want the rest, and an administrator
opens it up.

**Sign in.** `POST /api/auth/register` and `/api/auth/login`. Passwords are
hashed with scrypt from `node:crypto` — memory-hard, no dependency — and
compared in constant time. Sessions are opaque random tokens held server-side in
an httpOnly `SameSite=Lax` cookie, not signed claims, because revoking a
subscription or disabling an account has to take effect on the next request and
a self-contained token cannot be withdrawn early.

**The administrator.** Seeded on first boot as `admin` / `admin`, as asked, so
there is nothing to set up before a presentation. Override with
`HUNTER_ADMIN_USER` / `HUNTER_ADMIN_PASSWORD`; while the default password stands
the server says so at startup and the sign-in screen shows the credentials as a
presenter's hint. Set a real password before this is reachable from the internet
— the warning disappears on its own once you do.

**Subscriptions without a gateway.** No payment integration, since a Hungarian
provider comes later. An admin grants access by hand from the Admin screen:
pick a plan (5-day trial, monthly, quarterly, annual), optionally override the
number of days, add a note. Granting on top of an active subscription *extends*
it rather than discarding the remainder. Every grant and revocation is logged
with who did it and when.

**What the gate actually withholds.** Enforced on the data, not the markup: the
browser ranks locally, so `/api/catalog` sends a free account only the calls it
is entitled to (plus the honest totals) rather than the whole catalog. Hiding
rows in the UI while shipping the data to the page would be a paywall in name
only.

| | Registered, no subscription | Subscriber |
|---|---|---|
| Match and eligibility counts | full and honest | full |
| Ranked results shown | first 3, rest as locked placeholders | all |
| Five-factor reasoning | — | yes |
| Exclusions with reasons | — | yes |
| Grant calculator | — | yes |
| Submission links | — | yes |

The counts stay whole on purpose: *"247 calls you are eligible for"* is the
argument for subscribing, and hiding it would sell the product worse than
showing it.

**Two workspaces.** An administrator has two jobs — seeing what a client sees,
and running the accounts — so the shell has a switcher between a *Client view*
and the *Admin console*. Signing in as an administrator lands in the console;
one click moves to the client view and back. The console has three screens:

- **Overview** — the operations view: who is *awaiting access*, whose
  subscription *expires within 14 days* (both with one-click grant/extend),
  active plans, recent sign-ups, and the activity feed across every account.
- **Users** — the full table, with per-row plan, custom duration, note,
  disable/enable and that account's history.
- **System** — catalog size, when it was last built and by what, the EUR/HUF
  rate in use, the refresh loop's schedule, run and failure counts, last error,
  and a *Refresh now* button.

Signing out sits in the account block at the foot of the rail, next to the
account name, and on mobile in the bottom navigation.

**Profiling history.** Every profile save is a version, stored with a diff
against the previous one, so the Account screen reads as a list of changes
(*employees 28 → 45*, *project value 30M → 95M*) rather than a stack of
identical-looking snapshots. An identical re-save does not create a version. Any
version can be restored, and the restore is itself recorded. Alongside it runs an
activity log — sign-ins, profile saves, questions answered, calls viewed and
saved, searches, subscription changes — visible to the account and to an admin
from the user's row.

### 6.3 The CRM

Granting access answers *who is waiting*. It does not answer the question that
follows it: **who is worth calling this week, and what was said to them last
time.** That is what the CRM screen in the admin console is for.

The design rule is the same one that governs the rest of the product — **the
system does not state as fact anything it has not observed** — so the CRM splits
what it knows from what a person thinks:

| | Where it comes from | Who can change it |
|---|---|---|
| **Lifecycle** — lead / registered / trial / subscriber / lapsed | Read off the subscription and the subscription log | Nobody. It is not an opinion. |
| **Stage** — new / contacted / qualified / proposal / won / lost | An operator's judgement, stored with who set it and when | The operator |
| **Engagement** — 0–100 | Counted from the account's real activity log | Nobody |
| **MRR / ARR / conversion / churn** | Computed from the real price list against subscriptions that are active right now | Nobody |

Nothing derived is stored. Every figure is recomputed per request from the
account, its activity and its subscription log, so the console cannot show a
number that has drifted away from the truth. Where there is no data the answer
is `null` and the screen says so — a trial-conversion rate of *"—"* when nobody
has ever trialled, never a reassuring `0%`.

**Engagement is explainable, not a prediction.** It counts six real behaviours
over 30 days — sign-ins, calls opened, calls saved, searches, eligibility
questions answered, profile saves — each worth fixed points and capped so no
single behaviour carries the score, then discounted by how long the account has
been silent. The contact page prints the breakdown beside the number, the same
way an opportunity prints its five factors. The most useful thing it produces is
the *"active but not yet subscribed"* list: accounts that are using the product
and have not paid for it, ordered by how much they are using it.

**Revenue is the real price list.** A monthly plan is 5 990 HUF, a quarterly one
16 990 and an annual 59 900 — normalized to a 30-day figure (5 990 / 5 663 /
4 923) and summed over subscriptions that have not expired. A trial contributes
nothing, because it is worth nothing until it converts. The one figure that
rests on judgement — expected pipeline value — is labelled an expectation on the
screen.

**Leads.** The free assessment is the top of the funnel and it used to produce
nothing: a visitor answered six questions, saw a readiness score and left
without a trace. It now offers a follow-up at the end. With the visitor's
explicit consent — no consent, no record, and the address never leaves the
browser without it — the answers they actually gave, the score those answers
actually produced and the calls they actually matched are stored as a lead. When
someone later registers with that address, the notes and follow-ups written
against the lead move onto the account, so the conversation survives the moment
they sign up.

Four screens: **Pipeline** (a board, drag between columns or use the dropdown on
each card, which is the route that works on a touch screen), **Contacts** (search,
filter, sort, CSV export), **Leads**, and **Insights** (funnel, revenue by plan,
source breakdown, six-month trend — plain inline SVG, no chart library, and an
empty month is drawn rather than skipped, because a gap is information too).

Deleting an account deletes its CRM record with it: those notes are about a
named person, so leaving them behind would keep exactly the data the deletion
was meant to remove.

### 6.4 Does this need a database?

No — and for the user data, a database would be the wrong answer.

There are two kinds of state here, and they want opposite things:

**The catalog is derived data, not records.** It is rebuilt wholesale from the
portal every few hours; nothing is ever edited in place, and losing it costs one
refresh cycle. A file read into memory at boot is the right shape: the BM25 index
and the rule engine need the whole thing in memory anyway, so a database would
add a dependency and an I/O hop to reach the same array. At 600 calls it is 12 MB
on disk and answers every request without touching it again. This holds to
roughly the tens of thousands; past that, an inverted index that does not fit in
memory is the signal to move — not the row count.

**User data depends on whether there is an owner to key it on**, and there are
now two cases:

*Anonymous visitors* still keep everything in `localStorage` and send it with
each request. This was a real bug before: one shared `db.json` meant the second
visitor to open a hosted instance would see the first visitor's company, scores
and favourites. `/api/health` reports `storage.persistProfile: false`, and a test
asserts two concurrent visitors get their own results with nothing written to
disk.

*Signed-in accounts* do have an owner, so their profile, answers, favourites,
version history and activity live on the server in
[server/store.js](server/store.js) and follow them between devices.

That store is a JSON document written atomically, not a database — a deliberate
fit for the current scale (tens of accounts for a sales demo): nothing to install
on the host, no migration to run before a presentation, and small enough to hold
in memory beside the catalog. Writes are serialized and land via a temp file and
rename, so a crash cannot truncate it; a corrupt file is moved aside rather than
silently becoming an empty one, because "all accounts vanished" is the worst
possible failure here.

`node:sqlite` ships with Node 22 and was considered, but it is flagged
experimental and its API may change between releases — the wrong risk to carry
into a hosted demo.

**The trigger for moving to SQL** is concrete: a few hundred accounts, or a
second process needing to share state (more than one instance behind a load
balancer). The swap is one file — `Store` is a repository interface and nothing
above it knows how rows are stored. The natural shape is Postgres, or SQLite on a
single host, with `user`, `session`, `profile_version`, `subscription_log` and
`activity` tables mirroring what the JSON already holds. The catalog stays a
file either way.

### 6.5 Deploying

Any host that runs Node 20 and allows outbound HTTPS. One process, no build step,
no services to provision.

```bash
npm start                       # serves the app and the API on $PORT
```

The catalog file can ship with the image or be built on first boot with
`HUNTER_REFRESH_ON_BOOT=true` — the server starts and serves an empty catalog
rather than failing if one is missing, and fills it on the first cycle. Give
`HUNTER_DATA_DIR` a writable volume if you want the refreshed catalog to survive
restarts; without one, each boot refetches.

---

## 7. API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create a company account |
| `POST` | `/api/auth/login` / `/api/auth/logout` | Start and end a session |
| `GET` | `/api/auth/me` | Current account, entitlements and grantable plans |
| `POST` | `/api/auth/password` | Change password |
| `GET` | `/api/profile/history` | Profile versions with diffs, plus the activity log |
| `POST` | `/api/profile/restore` | Restore an earlier profile version |
| `GET` | `/api/admin/overview` | *(admin)* Operations view: what needs acting on, plus system health |
| `GET` | `/api/admin/users` | *(admin)* Accounts, subscriptions and statistics |
| `POST` | `/api/admin/subscription` | *(admin)* Grant, extend or revoke access |
| `POST` | `/api/admin/user` | *(admin)* Disable, enable or change a role |
| `GET` | `/api/admin/history` | *(admin)* One account's full history |
| `GET` | `/api/admin/crm` | *(admin)* Pipeline board, portfolio metrics, open follow-ups |
| `GET` | `/api/admin/crm/contacts` | *(admin)* Contacts with search, filters, facets, paging; `format=csv` exports |
| `GET`/`POST` | `/api/admin/crm/contact` | *(admin)* One contact in full; set stage, owner, tags |
| `POST` | `/api/admin/crm/note` | *(admin)* Add or delete a note |
| `POST` | `/api/admin/crm/task` | *(admin)* Add, complete or delete a follow-up |
| `GET` | `/api/admin/crm/leads` | *(admin)* Captured assessment leads |
| `POST` | `/api/admin/crm/lead` | *(admin)* Edit or delete a lead |
| `POST` | `/api/leads` | Capture a lead from the free assessment (consent required) |
| `GET` | `/api/health` | Status and catalog size |
| `GET` | `/api/meta` | Vocabularies, labels and catalog statistics |
| `GET` | `/api/catalog` | Every live call with its rules, for client-side re-ranking |
| `GET` | `/api/search` | Full-text + filters + facets + pagination |
| `GET` | `/api/dashboard` | Shortlist, exclusions with reasons, upcoming deadlines |
| `GET` | `/api/opportunities/:id` | Detail: verdict, factor breakdown, calculator, benchmarks |
| `POST` | `/api/opportunities/:id/answer` | Answer an open question and recalculate |
| `POST` | `/api/opportunities/:id/save` | Toggle a favourite |
| `GET` | `/api/saved` | Saved calls, re-scored |
| `GET`/`POST` | `/api/profile` | Read and write the company profile |
| `POST` | `/api/profile/load-demo` | Load the demo company |
| `GET` | `/api/benchmarks` | Funded-project statistics |
| `POST` | `/api/sync` | Refresh from the live portal without a rebuild |

`/api/search` accepts `q`, `program`, `actionCode`, `goals`, `sectors`,
`orgType`, `consortium`, `deadlineFrom`, `deadlineTo`, `budgetMin`, `budgetMax`,
`minIntensity`, `minScore`, `eligibleOnly`, `sort`, `page`, `pageSize`, `lang`
and `personalized`. Repeated or comma-separated values are OR-ed within a field
and AND-ed across fields.

Responses are gzipped when the client accepts it — the catalog goes from 1.3 MB
to 112 KB.

---

## 8. Tests

```
npm test     # 106 tests
```

| File | Covers |
|---|---|
| [tests/engine.test.js](tests/engine.test.js) | Rule operators; the pinned demo scores |
| [tests/pipeline.test.js](tests/pipeline.test.js) | Normalization, consortium modelling, stale-record filtering, classification, search, benchmarks, catalog integrity |
| [tests/server.test.js](tests/server.test.js) | Every endpoint against a live server on a scratch data directory |
| [tests/refresh.test.js](tests/refresh.test.js) | Refresh success, failure, empty-result rejection, backoff, atomic write; and that two visitors stay isolated |
| [tests/crm.test.js](tests/crm.test.js) | Lifecycle and engagement arithmetic, MRR/conversion/churn, CSV, lead validation, the store, and every CRM endpoint against a live server |
| [tests/ui.test.js](tests/ui.test.js) | `index.html`'s script in a DOM shim — every screen, including sign-in, account, admin, empty catalog, missing budget and unknown id; plus that every UI string has an English rendering |

Three defects these caught, all fixed:

- **The paywall was decorative.** `/api/search` and `/api/dashboard` were gated,
  but the browser ranks locally from `/api/catalog`, which was not — so a free
  account's page held every paid answer. The catalog endpoint now sends a free
  account only its entitled slice, with the real totals alongside.

- **The static handler served the project root.** The URL parser normalizes
  `../` away, so `/package.json`, `/src/engine/scoring.js` and
  `/server/data/db.json` — the user's saved profile — were all reachable. Serving
  is now restricted to the app shell and an optional `public/` directory.
- **Prizes and quality labels ranked as funding.** Horizon prizes and the
  European Solidarity Corps quality label award no money; they are flagged
  `awardsFunding: false` and excluded from the shortlist by default.

---

## 9. Scope

Deliberately not built: a payment gateway — a Hungarian provider comes later, so
subscriptions are granted by an administrator — and the Hunter Plus AI drafting
workspace, whose screen assembles a template draft from live catalog data rather
than calling a model.

Two things about that Hunter Plus screen are worth stating plainly, because the
interface does not currently say them where the user can see them: its
*"Generate AI Draft"* button runs no model — it fills a fixed three-chapter
template with the company's real numbers — and its *"Activate (5 990 HUF/mo)"*
button takes no payment and creates no subscription; it sets a flag in the
visitor's own browser and reports success. The original prototype labelled both
of these *"(demo)"*. Restoring that labelling is the first thing to do before
this screen is shown to a paying customer.

`hunter-mvp.html` is a byte-identical copy of `index.html`, kept because the
original deliverable was described as a single portable file.

The original product specification is in
[HUNTER-PROJECT-OVERVIEW.md](HUNTER-PROJECT-OVERVIEW.md).

---

## 10. Sources

| Source | Used for |
|---|---|
| [EU Funding & Tenders Portal](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home) (SEDIA search API) | Open and forthcoming calls |
| [Kohesio](https://kohesio.ec.europa.eu/) | Funded Hungarian cohesion-policy projects, as benchmarks |
| [ECB daily reference rates](https://www.ecb.europa.eu/stats/eurofxref/) | EUR/HUF conversion |
| Hungarian national programmes | Nine curated reference calls |

Every opportunity in the app links to its official call page. The eligibility
output is a pre-screen, not an official determination — the interface says so on
every detail page.
