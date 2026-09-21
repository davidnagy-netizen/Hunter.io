# Scoring golden fixtures

`catalog.json` — 48 real EU funding calls (trimmed to the fields scoring reads), chosen to cover every branch of the
formulas (consortium, partner share, no funding range, high admin burden, no documents, not "described", non-funding).

`expected.json` — what the **prototype's JavaScript engine** (`hunterScore` / `explainScore`, from the Node app this
backend replaces) produced for 8 different companies and answer sets on those calls, at reference date 2026-09-21:
score, verdict, blocked/estimated flags, days left, the five factor values, and (for two companies) every factor's
label and explanation text in Hungarian and English.

`tests/Unit/ScoringParityTest.php` requires `App\Services\Api\Scoring` (with `Profiles::normalize`) to reproduce all of
it. Until this existed the PHP scorer disagreed with the prototype (wrong sector codes, empty explanations); the
prototype engine has since been retired, so this is the record of what "right" was.

One deliberate difference from the prototype is baked in: `consortium_ready` given as an *answer* (a per-call answer,
else a global one, else the profile) affects feasibility. The prototype read only the profile, so an answered question
did not move the score. `generate.mjs` applies the same rule so the fixture encodes the intended behaviour.

Regenerate (needs the prototype's `src/engine` and `src/data`, e.g. from git history of the frontend's
`vendor/engine-src/`):

    ENGINE_DIR=<dir with engine/ and data/> OUT_DIR=tests/Fixtures/scoring \
    SRC_CATALOG=<catalog.json with an "opportunities" array> PROFILES=<profiles.json> node generate.mjs
