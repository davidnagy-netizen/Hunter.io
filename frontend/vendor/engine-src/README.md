# Vendored scoring engine (browser-side)

Six pure-ESM files copied **unchanged** from the Node prototype's `src/`
(repo `Hunter.io`, commit `cf56909`, 2026-09-18):

| File | Used for |
|---|---|
| `engine/eligibility.js`, `engine/scoring.js`, `engine/profile.js` | The eligibility verdicts, the five-factor score and profile normalisation the app runs **in the browser** for a subscriber's catalog |
| `data/referenceData.js`, `data/taxonomy.js` | Vocabulary those files import |
| `data/mockGrants.js` | **Tests only** — fixture opportunities (never bundled into the app) |

## Why it lives here

The frontend used to import these from the Node server's `src/` through an alias. The backend is now Laravel
(PHP), so there is no `src/` to import from. Browser-side scoring is kept on purpose (an agreed decision: the client can
score a catalog it already holds, and it is the fallback if the API is unavailable), so the engine is vendored.

## The risk to manage

The PHP backend has its **own** implementation of the same formulas (its notes say they follow `hunter-mvp.html`, not
this file). Two engines can drift. Until a parity test compares them on the same fixtures, treat any score difference
between the API (search/detail) and the browser (catalog) as a bug in one of them, not as noise.

## Rules

- Do not edit these files to change behaviour. Change the backend, or replace the whole directory.
- Still names the score `hunterScore()` (the prototype's name); `src/features/scoring/domain/engine.ts` re-exports it as
  `fundorScore` so nothing else in the app says Hunter. Keep that boundary.
