<?php

/**
 * API Routes Definition.
 *
 * Here is where you can register API routes for your application.
 * These routes are assigned the "api" middleware group.
 */

use App\Http\Controllers\Api\AccountPrivacyController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\NavTaxpayerController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Middleware\FundorApi;
use App\Services\CompanyMetrics;
use App\Services\Sector\TeaorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(FundorApi::class)->group(function () {
    Route::get('/health', HealthController::class)->name('api.health');
    Route::post('/nav/taxpayer', [NavTaxpayerController::class, 'lookup'])->name('api.nav.taxpayer');
    Route::post('/v1/taxpayer/lookup', [NavTaxpayerController::class, 'lookup']);
    Route::get('/v1/sectors/search', function (Request $request, TeaorService $sectors) {
        $request->validate(['query' => 'nullable|string|max:100']);

        return response()->json(['data' => $sectors->search((string) $request->query('query', ''))]);
    })->middleware('throttle:60,1');
    Route::get('/v1/onboarding/options', fn () => response()->json(['counties' => CompanyMetrics::COUNTIES, 'legal_forms' => CompanyMetrics::LEGAL_FORMS]));
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/verification/resend', [AccountPrivacyController::class, 'resend'])->middleware('throttle:3,1');
    Route::get('/auth/verify/{id}/{hash}', [AccountPrivacyController::class, 'verify'])->middleware(['signed', 'throttle:10,1'])->name('verification.verify');
    Route::get('/v1/account/export', [AccountPrivacyController::class, 'export']);
    Route::delete('/v1/account', [AccountPrivacyController::class, 'erase'])->middleware('throttle:5,1');
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'save']);
    Route::post('/profile/load-demo', [ProfileController::class, 'demo']);
    Route::get('/profile/history', [ProfileController::class, 'history']);
    Route::post('/profile/restore', [ProfileController::class, 'restore']);
    Route::get('/meta', [CatalogController::class, 'meta']);
    Route::match(['get', 'post'], '/catalog', [CatalogController::class, 'index']);
    Route::match(['get', 'post'], '/search', [CatalogController::class, 'search']);
    // The existing listing URL uses the same paywall as the catalog.
    Route::get('/opportunities', [CatalogController::class, 'index'])->name('api.opportunities');
    Route::get('/opportunities/{id}', [CatalogController::class, 'show']);
    Route::post('/opportunities/{id}/save', [CatalogController::class, 'save']);
    Route::post('/opportunities/{id}/answer', [CatalogController::class, 'answer']);
    Route::post('/leads', [LeadController::class, 'store'])->name('api.leads');
    Route::get('/admin/overview', [AdminController::class, 'overview']);
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::get('/admin/history', [AdminController::class, 'history']);
    Route::post('/admin/subscription', [AdminController::class, 'subscription']);
    Route::post('/admin/user', [AdminController::class, 'patchUser']);
    Route::post('/refresh', [AdminController::class, 'refresh']);
    Route::get('/admin/crm', [CrmController::class, 'board']);
    Route::get('/admin/crm/contacts', [CrmController::class, 'contacts']);
    Route::get('/admin/crm/leads', [CrmController::class, 'leads']);
    Route::post('/admin/crm/lead', [CrmController::class, 'updateLead']);
    Route::get('/admin/crm/contact', [CrmController::class, 'contact']);
    Route::post('/admin/crm/contact', [CrmController::class, 'updateContact']);
    Route::post('/admin/crm/note', [CrmController::class, 'note']);
    Route::post('/admin/crm/task', [CrmController::class, 'task']);
});
