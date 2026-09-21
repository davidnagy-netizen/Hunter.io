# Frontend API integration

`openapi.yaml` is the required JSON contract. All 32 operations are routed through Laravel under `/api`.
The API uses the real application database: users, profiles, opportunities, leads, profile versions, saved calls,
answers, subscription history, activity, CRM notes and tasks persist across browser sessions.

## Start locally

```sh
composer install
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Use the existing database catalog, or run `php artisan db:seed --class=OpportunitySeeder` in an empty **development**
database to load the four demonstration calls. Those are examples, not verified live funding offers.
Do not run the general `DatabaseSeeder` on a shared deployment: it creates demonstration credentials.

Point the frontend dev server's `/api` proxy at `http://127.0.0.1:8000`. Keep browser requests same-origin.
Preserve the browser-facing host through the proxy so Origin/Referer checks see the same origin. In production,
serve the frontend and `/api` on one HTTPS origin and configure `FUNDOR_COOKIE_SECURE=true`.

## Requests and sessions

Use JSON bodies for **every POST**, including empty actions (`{}`). Send credentials on each request.
No bearer token is returned. Login/registration set the HttpOnly, SameSite=Lax `hunter_session` cookie with a
seven-day sliding expiry. API sessions are separate from the existing Blade web-login session.

```ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new ApiError(response.status, result.code ?? 'REFRESH_FAILED', result.error);
  return result as T;
}

await api('/auth/register', { username: 'frontend_demo', password: 'development-password', company: 'Example Ltd' });
const session = await api('/auth/me');
const demo = await api<{ profile: Record<string, unknown> }>('/profile/load-demo', {});
await api('/profile', { profile: demo.profile, source: 'onboarding' });
const catalog = await api('/catalog');
const search = await api('/search?q=digitalization&lang=en&page=1&pageSize=20');
await api('/auth/logout', {});
```

Translate errors using `code`; `error` is a Hungarian fallback. Validation returns `400 INVALID_REQUEST` with
an optional `fields` map. Missing sessions return `401 LOGIN_REQUIRED`; non-admin access returns `403 ADMIN_REQUIRED`.
Cross-origin browser mutations return `403 CSRF_REJECTED`; non-JSON mutations return `415 JSON_REQUIRED`.
The refresh failure response uses `{ok:false,error,status}` as specified. Cookies must not be read or stored by JS.

## Frontend behavior

- Load `/auth/me` to decide which screens to show. Do not infer access from the existence of a user alone.
- Anonymous profiles stay in the browser. Send `{profile, answers, saved}` to `POST /catalog` and `POST /search`.
  Neither endpoint persists anonymous data. Missing profiles are rejected; no demo profile is silently substituted.
- Signed-in profiles use `/profile`, `/profile/history`, and `/profile/restore`. Every save/restore records a version.
  Unknown profile fields survive saves. Answers support global and call scopes; `value:null` deletes an answer.
- `gated:true` means the catalog contains only teasers and aggregate counts. Teasers have positional refs, not call ids.
  The detail endpoint is also censored for anonymous and unsubscribed accounts. `/api/opportunities` is a gated catalog alias.
- Subscriber/admin catalogs contain declarative `hard`/`soft` rules. Server search/detail scoring uses the same five-factor
  formulas as the prototype in `hunter-mvp.html`. `/meta` provides reference data and the UTC scoring date.
- Search facets are computed after filtering. Comma-separated facet parameters are supported; use
  `program=HORIZON,DIGITAL`. Pagination defaults to 20, with a maximum of 100.
- Public lead capture requires literal JSON `consent:true`. Matching emails update an existing lead. No notification email is sent.
- Admin operations require `role:admin`, even if the caller has an active subscription. Subscription grants extend an active
  expiry; revocation removes access. Disabled accounts lose their API and database-backed web sessions.
- Treat ids as opaque strings. Accounts currently use string database ids; leads use `lead:<id>` to prevent collisions.
- CRM CSV downloads can use a normal same-origin link to `/api/admin/crm/contacts?format=csv`.
  The same filters apply to all exported rows. The response includes UTF-8 BOM and RFC-4180 quoting.

Use an existing administrator account for admin testing. A trusted operator can grant the role to a development account
through Tinker (`User::where('username', 'frontend_demo')->update(['role' => 'admin'])`); the public API never grants admin on signup.

## Deployment configuration

The specification names plans but supplies no numeric prices or EC portal API configuration. No prices are fabricated.

| Setting | Behavior |
| --- | --- |
| `FUNDOR_MONTHLY_HUF`, `FUNDOR_QUARTERLY_HUF`, `FUNDOR_YEARLY_HUF` | Total price per plan term. Unset means unknown; relevant CRM revenue fields are `null`. |
| `FUNDOR_EUR_HUF` | Optional catalog exchange-rate metadata. Unset returns `null`. |
| `FUNDOR_CATALOG_FEED_URL` | Trusted normalized catalog JSON feed, described below. Unset returns `503 REFRESH_UNAVAILABLE`. |
| `FUNDOR_COOKIE_SECURE` | Set `true` on HTTPS deployments. |

Plan durations are configured in `config/fundor.php`: trial 14 days, monthly 30, quarterly 90, yearly 365.
An explicit positive `days` override is supported on admin grants. Prices may be edited without changing the frontend.

The refresh adapter accepts a complete JSON document `{ "opportunities": [...] }`, whose entries follow the OpenAPI
`Opportunity` schema. It validates before writing and imports in a transaction. Existing curated calls are preserved;
other calls missing from a successful feed become closed. Invalid/empty/unreachable feeds return `502`, preserving
the existing catalog. **A raw EC Funding & Tenders portal ingestion adapter and scheduled refresh are not included**;
the configured upstream must supply normalized records. Nothing fetches external data during ordinary browsing.

## Verification

```sh
php artisan test --compact
```

The test suite exercises all 32 operations with anonymous, account, and admin responses.
Integration tests cover authentication, session cookies, account isolation, paywall leakage,
consent, subscription expiry/extension, note/task ownership, CSV export, and refresh handling.
