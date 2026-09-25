# CR-02: loan handling and testing

The backend supports manually reviewed loan records and a separate, unranked informational catalog at `GET /api/loans`. Credit recommendations, personalized eligibility and interest-subsidy/cost-of-capital evaluation remain **unimplemented and blocked pending the formal MNB legal opinion**, as required by AGENTS.md. There is no environment switch to bypass this gate. A follow-up implementation must use the approved legal scope and documented product calculation rules.

Free visitors and free accounts receive only available counts and category badges, not product identities or terms. `eligibleCount` is deliberately `null`: available products are not a claim of eligibility. Active Fundor Plus accounts (and existing administrator entitlements) receive manually reviewed terms and provenance. The response never includes a grant score or treats principal as a funding benefit. Expired subscriptions lose access. The React entry point shows the HU/EN regulatory notice outside authentication and subscription gates; no loan browsing page has been added.

## Automated checks

From the repository root:

```powershell
php artisan test --filter=LoanHandlingTest
php artisan test --filter=InstrumentTypeScoringTest
php artisan test
php vendor/bin/pint --test
npm run test
npm run typecheck
npm run lint
```

Tests use an in-memory SQLite database and fake HTTP requests. They do not query Kavosz or change the application database. The frontend scripts are the existing package scripts; npm can run the installed dependencies without pnpm's automatic reinstall.

Coverage includes provenance validation, direct database insert/update rejection, all debt types including `combined`, blocked feed imports, prohibited hosts and redirects, preservation of manual records, subscription expiry, public metadata leaks, manual-import attestation and the bilingual disclaimer.

Verified locally: 172 backend tests (6,185 assertions), 528 frontend tests, TypeScript checking and frontend lint passed. `php vendor/bin/pint --dirty --test` passed for changed files. The full-repository Pint check still reports existing formatting issues in untouched files.

## Local manual check

1. Run `php artisan migrate` on your development database, then `php artisan serve` and `npm run dev` in separate terminals. The new migration refuses existing non-grant/invalid records rather than inventing provenance. If it stops, review those records and prepare a data migration before retrying; do not relabel loans as grants.
2. Create a local JSON file using the structure below. For a local-only smoke test use the explicitly synthetic example; never publish it as an actual loan. Real records must be transcribed from a manually verified official Business Rules document. Set the dates for your test day so the record is effective, verified no later than today and not past its deadline.

```json
{
  "code": "local-test-loan",
  "instrument_type": "subsidised_loan",
  "title": "Synthetic local test loan — not a real product",
  "program": "Local test only",
  "deadline": "2027-12-31",
  "status": "open",
  "effective_from_date": "2026-09-25",
  "last_verified_date": "2026-09-25",
  "source_document_reference": "SYNTHETIC TEST — no official product",
  "loan_terms": "Synthetic local test terms; no financial offer."
}
```

3. Import the file locally:

```powershell
php artisan fundor:import-reviewed-loan loan.local.json --reviewed-by="Local tester" --confirm-manual-review
```

The command reads only a local file and never fetches URLs. It refuses to overwrite a grant. Reimporting the same loan code updates that loan, its reviewer and verification details. Store the current reviewed terms in `loan_terms` as plain text, not executable HTML. The review flag is an operator attestation, not automated proof of the document's accuracy.

4. Open `/api/loans?lang=en` on the backend origin without login: expect `gated: true`, `loans: []`, `availableCount: 1` if this is the only active record, a category count, the disclaimer, and `evaluationStatus: BLOCKED_PENDING_MNB_LEGAL_OPINION`.
5. Log into a verified Fundor Plus account on the same origin and request that URL again: expect the terms and all three provenance fields in `loans`. A free/expired account still gets no details. `GET /api/opportunities/local-test-loan` must return 404 even for Plus; grant catalog/search must omit it.
6. Check the website before login and after login: the regulatory notice must appear in both languages, regardless of subscription.
7. Repeat the import with a missing source reference, future verification date, or without the confirmation flag: it must fail. Close the synthetic record by reimporting with `status: closed` when done.

## Feed and deployment changes

Every automatic feed item now **must** declare `instrument_type: "grant"`. Missing types and debt types reject the whole feed before mutation. Update the feed producer before enabling refresh. Kavosz hosts are blocked and redirects are not followed; debt records can only enter the supported import flow through manual review.

The migration enforces database constraints using SQLite triggers or PostgreSQL/MySQL CHECK constraints (MySQL must support enforced CHECK constraints, e.g. 8.0.16+). Automated tests cover SQLite; validate migration up/down on the deployment database engine in staging. No production migration or real loan import is performed by these tests.
