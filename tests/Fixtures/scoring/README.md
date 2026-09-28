# Scoring golden fixtures

`catalog.json` contains 48 real EU funding calls, trimmed to the fields scoring reads, covering
consortium requirements, partner share, missing funding ranges, high administrative burden,
missing documents, undescribed calls and non-funding opportunities.

`expected.json` records the retired prototype engine's results for 8 companies and answer sets
at reference date 2026-09-21: score, verdict, blocked/estimated flags, days left, five factor
values and, for two companies, factor labels and explanations in Hungarian and English.

`tests/Unit/ScoringParityTest.php` checks `App\Services\Scoring` with `Profiles::normalize`
against these expectations, with the clock fixed to the reference date. Run from the repository root:

```bash
php artisan test --filter=ScoringParityTest
```

One deliberate correction is captured: `consortium_ready` uses a per-call answer first,
then a global answer, then the profile. The prototype originally read only the profile.

The landing-page refresh and shared color tokens do not change these scoring expectations.
Illustrative landing scores are presentation content in `src/data/landingContent.ts`, not golden fixtures.

The historical fixture generator is no longer included. Preserve these files as regression
baselines; change expectations only alongside a reviewed scoring-rule change and its Laravel tests.
