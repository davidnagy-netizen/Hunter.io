# Hunter — What Is Real, and What Is Still a Demonstration

**Status report for the client · 13 September 2026**
Covering the build running at commit state of this date, catalog built 2026-09-12.

---

## Why this document exists

Hunter looks finished. Nearly every screen is populated, the numbers move when
you change your company profile, and the buttons all respond. That is exactly
why this document is necessary: **some of those screens are backed by a real
engine and live data, and some are presentation pieces that respond without
doing anything.** Both look the same from the outside.

Nothing here is a criticism of the build. A demonstration build is supposed to
have demonstration parts. The purpose of this document is to draw the line
precisely, so that the decisions in front of you — what to sell, what to
promise, what to fund next — rest on what the software actually does today.

Every claim below was verified by running the software and reading the code, not
from the specification. Where a claim is worth checking yourself, the file and
line are given.

---

## 1. At a glance

| Area | Status | One-line summary |
|---|---|---|
| Funding catalog | ✅ **Real** | 621 calls pulled from the official EU portal, auto-refreshed every 6 h |
| Currency conversion | ✅ **Real** | Live ECB daily reference rate |
| Eligibility engine | ✅ **Real** | Deterministic rule engine, rules carried per call |
| Match scoring | ✅ **Real** | Five weighted factors, computed per company |
| Grant calculator | ✅ **Real** | Your project value × call intensity, capped by ceilings |
| Benchmarks | ✅ **Real** | 400 completed Hungarian projects from Kohesio |
| Accounts & login | ✅ **Real** | scrypt password hashing, server-side sessions |
| Paywall / tiers | ✅ **Real** | Enforced on the server, not just hidden in the browser |
| Admin console | ✅ **Real** | Grant/revoke access, account management |
| Sales CRM | ✅ **Real** | Contacts, stages, notes, tasks, CSV export, MRR |
| Bilingual HU/EN | ✅ **Real** | Full dictionary, enforced by an automated test |
| **Payment gateway** | ❌ **Not built** | No provider connected; access is granted by hand |
| **"Try free for 5 days"** | ⚠️ **Misleading** | The button does not start a trial |
| **"Activate 5 990 HUF/mo"** | ⚠️ **Misleading** | Takes no payment; sets a flag in the visitor's own browser |
| **"Generate AI Draft"** | ⚠️ **Misleading** | Calls no AI model; fills a fixed three-chapter template |
| Hunter Plus workspace | ⚠️ **Demo** | Unlocked by the browser alone, not by the server |
| Email / notifications | ❌ **Not built** | Nothing is ever sent to anyone, including new sales leads |
| Deadline reminders, .ics | ❌ **Not built** | Promised in on-screen text only |
| Hungarian national calls | ❌ **Not present** | The catalog is 100 % EU-level; no GINOP, KEHOP, Széchenyi |

---

## 2. What is real

This section is the substance of the product. It is more than it may appear,
and it is the part worth selling.

### 2.1 The funding catalog is genuine live data

The catalog holds **621 calls — 354 open, 267 forthcoming** — and every one of
them came from the European Commission's official Funding & Tenders Portal
through its SEDIA search API. There is no hand-written filler in the live
catalog: the count of hand-authored demonstration entries currently included is
**zero**.

The ingestion is not a blind copy. Of 592 open calls offered by the portal, the
pipeline kept 354: it dropped 238 whose deadlines had passed and 19 that award
no money (prizes and quality labels, which do not belong in a funding
shortlist). That filtering is recorded in the catalog metadata, so the numbers
can be audited rather than taken on trust.

**Refresh is automatic.** The server re-pulls the portal every 6 hours by
default, configurable, and can be disabled. This is real scheduled work, not a
manual rebuild.

**Currency is live.** Euro amounts are converted at the European Central Bank's
daily reference rate — 364.45 HUF/EUR at the last refresh — and the rate is
stamped with its source and fetch time on every record.

### 2.2 The eligibility engine genuinely decides

This is the strongest part of the product and the hardest to copy. Each call
carries machine-readable rules (organisation type, country, company size,
sector, own-funding requirements). The engine evaluates them against the company
profile and returns one of four verdicts, with the specific failing condition
named.

For the demonstration company — a 28-employee manufacturer in Pest county — the
engine rules **116 calls out** with a stated reason. That negative answer is
arguably worth more than the positive one: it is the "do not spend three weeks
on this application" signal, and no list-based competitor provides it.

The scoring is not a black box either. Every match breaks down into five
weighted factors — eligibility 0.35, project fit 0.25, grant size 0.15, timing
0.15, feasibility 0.10 — each with a plain-language explanation. Where the
engine does not know something, it says so rather than inventing a figure: on a
call that publishes no funding band, the size factor is returned as a neutral 50
with the note that the call does not state one.

### 2.3 The grant calculator does real arithmetic

For any call, the product computes what this specific company would receive: a
30 M HUF project at 80 % intensity returns a 24 M HUF grant and a 6 M HUF own
contribution, capped by the call's own ceiling where one exists, and by the
company's own partner share on consortium calls.

### 2.4 Benchmarks are real completed projects

The comparison figures come from **400 real funded projects** in Kohesio, the
Commission's cohesion-policy project database, covering 18 goal categories. A
company sees the median budget, the median EU contribution and the median
co-financing rate for projects like its own, with named beneficiaries and links
to the source records. This answers "is the number I just typed in realistic",
which is the first question any applicant has.

### 2.5 Accounts and the paywall are properly enforced

Passwords are hashed with scrypt and compared in constant time. Sessions are
opaque server-side tokens, so revoking someone's access takes effect
immediately. Login responses are identical whether or not the username exists,
so the system cannot be used to discover who has an account.

The paywall matters commercially, so it is worth being precise: **it is enforced
on the server.** A free visitor's browser never receives the paid data at all.
This was tested directly, including the two routes that would normally undermine
such a gate — the browser's local ranking engine is sent an empty catalog, and
replaying call identifiers through the saved-items endpoint returns censored
rows rather than whole records.

What a free visitor sees today is the match score and the grant amount they
would receive, with the identity of the call — its name, programme, deadline and
application link — withheld. The counts stay honest: the product tells them they
qualify for 266 calls worth 285 M HUF in total, and then declines to say which.

### 2.6 The admin console and CRM are working software

An administrator can grant, extend and revoke subscriptions; extending an active
plan correctly adds to the remaining time rather than discarding it. Accounts
can be disabled and re-enabled, and disabling one ends its sessions immediately.
An administrator cannot disable, demote or delete their own account — a guard
that exists because that mistake was made once already during development.

The CRM is complete enough to run a sales desk: contacts with lifecycle stages,
owners, tags, notes, tasks with due dates, CSV export, and revenue metrics (MRR,
ARR, ARPA, trial-to-paid conversion, churn) computed from the subscription log
rather than estimated. Leads captured from the public assessment are
de-duplicated by email address and are automatically converted into the customer
record when that person later registers, carrying their notes and follow-ups
across.

### 2.7 Engineering quality

- **106 automated tests, all passing**, covering the rule engine, the data
  pipeline, the API, the CRM and the user interface.
- **Zero third-party dependencies.** The entire server runs on the Node.js
  standard library. No supply-chain exposure, no licence obligations, and
  nothing to patch when a package is compromised.
- Bilingual Hungarian/English throughout, with an automated test that fails the
  build if any Hungarian string lacks an English translation.

---

## 3. What is a demonstration

Everything in this section responds when clicked and reports success. None of it
does what its label says.

### 3.1 There is no payment gateway

**Nothing in Hunter can take money.** No provider is connected, no card details
are collected anywhere, and no subscription is ever created by a customer
action.

The only way an account becomes a paying subscriber is an administrator opening
the admin screen and granting a plan by hand. This is a deliberate decision
recorded in the codebase — a Hungarian payment provider was always intended to
come later — but it has two consequences that need stating in commercial terms:

- **Every single customer requires manual staff action** to activate, and again
  to renew. This is a per-customer labour cost that does not appear in any
  projection, and it is a hard ceiling on growth.
- **The product cannot be sold self-serve today.** A visitor who decides to buy
  at 2 a.m. has no way to do so.

The published price list is real and coherent — 5 990 HUF monthly, 16 990
quarterly (≈5 663/month), 59 900 annually (≈4 923/month) — it simply has no
mechanism behind it.

### 3.2 "Try it free for 5 days" does not start a trial

This is the primary call to action on the landing page and at the end of the
free assessment. Clicking it **carries the visitor's answers into the profile
setup form and nothing else.** No trial is created, no clock starts, and no
access is granted.

There is no self-serve trial anywhere in the system. A 5-day trial plan exists
in the price list, but the only way to receive one is for an administrator to
grant it manually.

This is the most commercially significant item in this document, because it sits
at the top of the funnel: the product's main promise to a new visitor is one it
cannot currently keep without a human being intervening.

### 3.3 "Activate (5 990 HUF/mo)" takes no payment and unlocks nothing real

The activation button on the Hunter Plus screen writes a flag into the
visitor's own browser storage, closes the dialog, and displays *"Hunter Plus
successfully activated!"*. No payment is requested, no server is contacted, and
no subscription record is created.

Two further points matter here:

- Because the flag lives only in that browser, **any visitor can unlock the
  Hunter Plus workspace for free** by clicking the button. That screen is gated
  in the browser only, unlike the rest of the product.
- The flag it sets is *not* the one the rest of the application reads to decide
  whether someone is a subscriber. The real paywall continues to apply
  everywhere else. So the button produces a success message and a partially
  unlocked screen that the server will not feed with data.

Reference: `activateSubscription()` in `index.html`.

### 3.4 "Generate AI Draft" calls no AI

The Hunter Plus workspace advertises chapter-by-chapter AI-generated
application text. The button assembles **a fixed three-chapter template** —
executive summary, technical implementation, budget — by inserting the company's
real numbers into pre-written Hungarian and English sentences. It then reports
*"Application draft generated!"*.

To be fair to the feature: the numbers it inserts are real, and the output is a
reasonable starting skeleton. But there is no language model anywhere in this
codebase, no API key, and no call to any AI provider. The word "AI" on that
button is not accurate today.

Reference: `generateAiDraft()` in `index.html`.

### 3.5 Nothing is ever emailed to anyone

There is no email capability in the system at all — no mail library, no SMTP
configuration, no outbound message of any kind. This has one immediate
operational consequence:

**When a prospect completes the free assessment and submits their contact
details, nobody is notified.** The lead is stored correctly and appears in the
CRM, but it sits there until a member of staff happens to log in and look. For a
product whose funnel depends on following up warm leads quickly, this is a
material gap.

Account emails — welcome, password reset, subscription expiring, deadline
approaching — likewise do not exist. Note in particular that **there is no
password reset**: a customer who forgets their password must be helped by an
administrator.

### 3.6 Deadline reminders and calendar export are text, not features

The Funding Calendar screen carries the line *"Reminders (30/14/7/3 days) and
.ics export are in the full version."* Neither exists in any form. There is no
reminder scheduler and no calendar file generation anywhere in the codebase.

### 3.7 A declared entitlement with nothing behind it

The subscription tiers declare an `exportData` permission for subscribers. No
feature reads it — there is no data export for customers anywhere in the
product. (The CRM's CSV export is real, but that is an internal admin tool, not
a customer feature.)

---

## 4. What the catalog actually contains

This section is separate from "real vs demo" because the data is entirely real —
but its composition may not match what the product appears to promise, and that
gap will surface in the first customer conversation.

### 4.1 There are no Hungarian national programmes

The catalog is **100 % EU-level calls**. It contains no GINOP Plusz, no KEHOP
Plusz, no DIMOP, no TOP Plusz, no Széchenyi Terv Plusz, no VINOP, no KAP, no
EFOP — none of the Hungarian national operational programmes.

This matters because the landing page lists exactly those programme names when
describing what a company would otherwise have to search through, which a
reader will reasonably take to mean Hunter covers them.

The reason is documented and legitimate: at the time of building,
`palyazat.gov.hu` and `szechenyiterv.gov.hu` did not accept connections at all,
so there was nothing to scrape. `kap.gov.hu` is reachable but publishes no
usable call database. The architecture anticipates this — there is a defined
seam for a national connector to plug into — but **the work has not been done,
and until it is, a Hungarian SME looking for domestic funding will not find it
here.**

### 4.2 The catalog is dominated by large consortium research

Of 602 open calls scored against the demonstration company:

| Measure | Count | Share |
|---|---|---|
| HORIZON (EU research framework) | 471 of 621 | 76 % |
| Require more than one partner | 437 of 602 | 73 % |
| Flagged high administrative burden | 457 of 602 | 76 % |

The product's stated target is the Hungarian SME. Most of this catalog is
cross-border consortium research, which a 28-person manufacturer cannot
realistically pursue alone. The headline figure of a ~1.9 Mrd HUF median maximum
grant is accurate but not achievable for that customer; any value argument
should be built on the narrower set the engine actually rates highly.

### 4.3 The screening engine reaches a verdict on 30 % of the catalog

For the demonstration company, across 602 open calls:

| Verdict | Count | Share |
|---|---|---|
| Insufficient data to decide | 420 | 70 % |
| Not eligible (ruled out, with reason) | 116 | 19 % |
| Conditional | 60 | 10 % |
| Eligible | 6 | 1 % |

Deterministic screening is the core value proposition, and for seven calls in
ten the honest answer is currently "the call does not publish enough structured
information to decide". The engine is right to say so rather than guess — but it
means the promise should be framed around **ruling calls out reliably**, which
it does for 116 calls, rather than around confirming eligibility, which it can
do for 6.

---

## 5. Known defects

Three of these were found by testing this build. They are not design decisions.

### 5.1 The server can be killed by a single file-write failure — and then lose data silently

**Severity: high. This one should be fixed before any real customer uses the
system.**

Account data is stored in a single file on disk. When the server saves it, it
writes a temporary file and renames it into place. On Windows that rename can
fail intermittently — an antivirus scanner or the search indexer briefly holding
the file is enough. The failure is not caught.

Two things then happen:

1. **The server process terminates.** Every logged-in user is disconnected. This
   was not theoretical: it happened during testing of this build.
2. If the process somehow survives, **every subsequent save is silently
   discarded.** This was reproduced deliberately: after a single injected
   failure, two newly created accounts existed in memory — the API returned
   success and issued valid login sessions — but never reached disk, and would
   vanish on the next restart.

A customer could register, pay, use the product, and find their account gone the
next morning, with no error shown at any point.

Reference: `#commit()` in `server/store.js`.

### 5.2 A locked-out administrator cannot be recovered through the product

If the only administrator account is disabled, there is no way back in through
the application — the start-up routine creates a missing administrator but never
re-enables a disabled one. Recovery requires editing the data file directly.

This is not hypothetical: it is exactly what had happened to this build before
testing began, and it is why the administrator account was inaccessible. A guard
now prevents an administrator from disabling their own account, so the specific
route is closed, but the recovery gap remains.

### 5.3 Two smaller items

- **The default-password warning reports the wrong thing.** At start-up the
  server warns that the administrator is using the default password. That
  warning is actually driven by whether an environment variable is set, not by
  the stored password — so it will keep warning after the password has been
  changed, and stay silent in cases where it should warn. (As it happens, the
  warning is currently correct: the administrator password is still the
  default.)
- **Changing a password does not end other sessions.** Anyone already logged in
  on another device stays logged in. The capability to end those sessions
  already exists in the codebase and is used when disabling an account; it is
  simply not called here.

---

## 6. What it would take to sell this

In the order that unblocks the most value per unit of work.

| # | Work | Why it is where it is |
|---|---|---|
| 1 | Fix the data-loss defect (§5.1) | Everything else is unsafe until customer records reliably survive |
| 2 | Relabel the three misleading buttons (§3.2–3.4) | Costs almost nothing and removes the risk of promising what the product cannot do. The original prototype labelled them *"(demo)"*; restoring that is the minimum |
| 3 | Connect a Hungarian payment provider | Removes the manual step from every activation and every renewal, and makes self-serve possible |
| 4 | Self-serve 5-day trial | Makes the landing page's main promise true; needs only the existing trial plan wired to a customer-facing action |
| 5 | Transactional email | Lead notification first (sales impact is immediate), then password reset, then expiry and deadline notices |
| 6 | A Hungarian national data connector | The largest single increase in customer value, and the largest piece of work. Currently blocked by the source portals themselves |
| 7 | Either build the AI drafting, or drop the claim | Both are defensible. What is not defensible is the current label |

Items 1 and 2 are days of work. Items 3–5 are the difference between a
demonstration and a business. Item 6 is the difference between a product for
Hungarian SMEs and a product about EU research funding.

---

## 7. Verifying any of this yourself

The system is running and every claim above can be checked directly.

| Account | Password | What it shows |
|---|---|---|
| `demo_free` | `demo1234` | The free experience — scores and amounts, identities withheld |
| `demo` | `demo1234` | Full subscriber access |
| `admin` | `admin` | Admin console and CRM |

Useful checks:

- **The catalog is real:** the ingestion counts and the ECB rate with its fetch
  timestamp are returned by the server's own metadata endpoint.
- **The paywall is real:** open the browser's developer tools while logged in as
  `demo_free`. The paid data is not in the page — it was never sent.
- **The AI draft is a template:** generate it twice for two different calls. The
  sentence structure is identical; only the inserted numbers change.
- **Activation takes no payment:** click *Activate*, then check the server's
  account list. The account's subscription status is unchanged.
- **The test suite:** `npm test` — 106 tests, currently all passing.

---

*Prepared by reading and running the build, not from the specification. Where
this document and the specification disagree, this document describes what the
software does.*
