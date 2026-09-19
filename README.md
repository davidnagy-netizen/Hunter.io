# Fundor.hu — SME Grant & Funding Intelligence (Laravel 13 Boilerplate)

A clean, modular, and idiomatic **Laravel 13** boilerplate foundation tailored specifically for the **Fundor.hu** funding intelligence platform for Hungarian SMEs.

---

## Languages

The interface supports Hungarian (`hu`, the default) and English (`en`). Use the language selector in the public header or application top bar; the selection is remembered for the session, including after logout. Switching keeps the current page and query parameters. Submit or save form changes before switching languages.

Translations use Laravel's `__()` helper with catalogs in `lang/hu.json` and `lang/en.json`. Hungarian validation and pagination messages are in `lang/hu/`. Available languages are configured in `config/localization.php`; the default uses `APP_LOCALE`.

Sample grant titles and document labels are translated for display. Company names, user-entered data, official program names, and database values retain their original content. New grant titles and document labels fall back to their original text until translations are added to the catalogs.

Run `php vendor/phpunit/phpunit/phpunit` to check language switching, validation, page rendering, and grant translations. Tests use an isolated in-memory SQLite database.

## 1. Project Overview & Architectural Migration

This repository was originally an unmodularized, legacy vanilla HTML, JavaScript, and Node prototype. It has been completely remade into a clean, modern Laravel 13 web application following native framework conventions.

### How the New Structure Replaces the Purged Legacy System:

| Legacy Layer / File | New Laravel 13 Component | Description / Responsibility |
|---|---|---|
| `public/index.html` & `fundor-mvp.html` | `resources/views/layouts/app.blade.php`, `resources/views/home.blade.php` | Modular Blade templates with design tokens (`--ink`, `--gold`, `--green`, typography). |
| `server/server.js` | `bootstrap/app.php` & `public/index.php` | Native Laravel HTTP kernel handling routing, middleware, and dependency injection. |
| `server/routes/catalogRoutes.js` | `App\Http\Controllers\OpportunityController` & `routes/web.php` | Grant search, catalog filtering, detail views, score breakdowns, and grant calculator. |
| `server/routes/authRoutes.js` | `App\Http\Controllers\AuthController` & `App\Models\User` | Idiomatic session authentication, registration, password hashing, and user roles. |
| `server/routes/crmRoutes.js` | `App\Http\Controllers\CrmController` & `App\Models\Lead` | Top-of-funnel lead captures, pipeline stages (`lead`, `contacted`, `qualified`), and CSV export. |
| `server/routes/adminRoutes.js` | `App\Http\Controllers\AdminController` | System monitoring, catalog stats, and user administration. |
| `server/routes/healthRoutes.js` | `routes/api.php` (`/api/health`) | Standard operational JSON health check endpoint. |
| `src/data/mockGrants.js` | `database/seeders/OpportunitySeeder.php` & `App\Models\Opportunity` | Curated reference calls (`ginop-dig`, `kehop-energy`, `dimop-ai`, `szechenyi-tech`) stored in database. |
| `src/engine/profile.js` | `App\Models\CompanyProfile` & `App\Http\Controllers\OnboardingController` | Structured SME profile (TEÁOR, headcount, region, revenue, goals, and de minimis flags). |

---

## 2. Directory Structure

```text
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AdminController.php       # Administrative monitoring and health
│   │       ├── AssessmentController.php  # Free 6-question readiness assessment flow
│   │       ├── AuthController.php        # Registration, login, and session logout
│   │       ├── CalendarController.php    # Month-by-month deadline tracking
│   │       ├── Controller.php            # Base controller class
│   │       ├── CrmController.php         # Lead capture, pipeline, and CSV export
│   │       ├── DashboardController.php   # SME overview and match cards
│   │       ├── FavoriteController.php    # Bookmarked opportunities
│   │       ├── HomeController.php        # Public landing page showcase
│   │       ├── OnboardingController.php  # 5-step company profile setup
│   │       └── OpportunityController.php # Catalog, score breakdown, grant calculator
│   ├── Models/
│   │   ├── CompanyProfile.php            # SME business profile model
│   │   ├── Lead.php                      # CRM lead capture model
│   │   ├── Opportunity.php               # Grant / funding call model
│   │   └── User.php                      # User account model
│   └── Providers/
│       └── AppServiceProvider.php
├── bootstrap/
│   ├── app.php                           # Laravel 13 application builder & router binding
│   └── providers.php                     # Service providers registry
├── config/
│   ├── app.php
│   ├── database.php
│   └── session.php
├── database/
│   ├── factories/
│   │   └── UserFactory.php
│   ├── migrations/                       # Database schema definitions
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── OpportunitySeeder.php         # Hungarian reference grant seeds
├── public/
│   ├── index.php                         # HTTP front controller
│   ├── .htaccess
│   └── robots.txt
├── resources/
│   ├── css/
│   │   └── app.css                       # Fundor.hu design tokens, colors, buttons, cards
│   ├── js/
│   │   ├── app.js
│   │   └── bootstrap.js
│   └── views/
│       ├── admin/                        # Admin dashboard, CRM board, and users list
│       ├── auth/                         # Login and registration views
│       ├── layouts/                      # App and Guest master Blade layouts
│       ├── opportunities/                # Opportunity catalog and detail views
│       ├── assessment.blade.php          # Readiness assessment page
│       ├── calendar.blade.php            # Deadline calendar view
│       ├── dashboard.blade.php           # Authenticated SME dashboard
│       ├── favorites.blade.php           # Saved opportunities view
│       ├── home.blade.php                # Public landing page
│       └── onboarding.blade.php          # Company profile wizard
├── routes/
│   ├── api.php                           # API health, JSON opportunities, and lead endpoints
│   ├── console.php                       # Artisan CLI command definitions
│   └── web.php                           # Standard web routes and controllers
└── tests/
    ├── Feature/
    └── Unit/
```

---

## 3. Quick Setup & Local Execution

### Prerequisites
- PHP 8.2 or higher (with `pdo`, `mbstring`, `openssl`, `tokenizer`, `curl` extensions enabled)
- Composer 2.x
- Node.js & npm (optional, for asset bundling with Vite)

### Step 1: Install Dependencies
```bash
composer install
```

### Step 2: Environment Configuration
```bash
cp .env.example .env
php artisan key:generate
```

### Step 3: Database Setup & Seed Initial Grants
Create the SQLite database (or configure MySQL/PostgreSQL in `.env`):
```bash
# For SQLite:
touch database/database.sqlite

# Run migrations and seed curated opportunities & demo accounts:
php artisan migrate --seed
```

> **Default Seed Accounts:**
> - **Administrator**: `admin` / `FundorAdmin2026!`
> - **Demo SME**: `demo_sme` / `DemoUser2026!`

### Step 4: Run the Local Development Server
```bash
php artisan serve
```

Access the application in your browser at `http://127.0.0.1:8000`.

---

## 4. Key Endpoints & Routes

| URI | Method | Controller Action | Description |
|---|---|---|---|
| `/` | `GET` | `HomeController@index` | Public landing page with featured grants |
| `/assessment` | `GET`, `POST` | `AssessmentController` | Free 6-question readiness score assessment |
| `/login`, `/register` | `GET`, `POST` | `AuthController` | Session authentication |
| `/onboarding` | `GET`, `POST` | `OnboardingController` | Company funding profile setup wizard |
| `/dashboard` | `GET` | `DashboardController@index` | SME match overview and score cards |
| `/opportunities` | `GET` | `OpportunityController@index` | Searchable grant catalog |
| `/opportunities/{code}` | `GET` | `OpportunityController@show` | 5-factor breakdown & grant calculator |
| `/calendar` | `GET` | `CalendarController@index` | Funding deadlines timeline |
| `/favorites` | `GET` | `FavoriteController@index` | Bookmarked opportunities |
| `/admin/dashboard` | `GET` | `AdminController@dashboard` | Platform metrics & user list |
| `/admin/crm` | `GET` | `CrmController@index` | CRM lead pipeline board & CSV export |
| `/api/health` | `GET` | `AdminController@health` | Operational health check JSON endpoint |
