<?php

/**
 * Web Routes Definition.
 *
 * Here is where you can register web routes for your application. These
 * routes are loaded by the RouteServiceProvider within a group which
 * contains the "web" middleware group.
 */

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CrmController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OpportunityController;
use Illuminate\Support\Facades\Route;

Route::post('/locale', [LocaleController::class, 'update'])->name('locale.update');

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Public landing page with featured opportunities showcase
Route::get('/', [HomeController::class, 'index'])->name('home');

// Top-of-funnel free grant readiness assessment wizard
Route::get('/assessment', [AssessmentController::class, 'show'])->name('assessment.show');
Route::post('/assessment', [AssessmentController::class, 'submit'])->name('assessment.submit');

// Grassfeld AI Budgeting App landing page showcase
Route::get('/grassfeld', function () {
    return view('grassfeld');
})->name('grassfeld');

/*
|--------------------------------------------------------------------------
| Guest Authentication Routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);

    Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

/*
|--------------------------------------------------------------------------
| Authenticated Application Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    // Session termination
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Onboarding wizard: Company Funding Profile
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    // Main SME Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Opportunities Catalog & Search
    Route::get('/opportunities', [OpportunityController::class, 'index'])->name('opportunities.index');
    Route::get('/opportunities/{code}', [OpportunityController::class, 'show'])->name('opportunities.show');
    Route::post('/opportunities/{code}/answer', [OpportunityController::class, 'answerQuestion'])->name('opportunities.answer');

    // Funding Calendar
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');

    // Saved / Bookmarked Opportunities
    Route::get('/favorites', [FavoriteController::class, 'index'])->name('favorites');
    Route::post('/favorites/{id}/toggle', [FavoriteController::class, 'toggle'])->name('favorites.toggle');

    /*
    |--------------------------------------------------------------------------
    | Admin & CRM Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/users', [AdminController::class, 'users'])->name('users');

        // CRM Lead & Contact Pipeline
        Route::get('/crm', [CrmController::class, 'index'])->name('crm');
        Route::post('/crm/leads', [CrmController::class, 'store'])->name('crm.leads.store');
        Route::patch('/crm/leads/{lead}/stage', [CrmController::class, 'updateStage'])->name('crm.leads.stage');
        Route::get('/crm/export', [CrmController::class, 'exportCsv'])->name('crm.export');
    });
});
