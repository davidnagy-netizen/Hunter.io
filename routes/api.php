<?php

/**
 * API Routes Definition.
 *
 * Here is where you can register API routes for your application.
 * These routes are assigned the "api" middleware group.
 */

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\NavTaxpayerController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Middleware\FundorApi;
use Illuminate\Support\Facades\Route;

Route::middleware(FundorApi::class)->group(function () {
    Route::get('/health', HealthController::class)->name('api.health');
    Route::post('/nav/taxpayer', [NavTaxpayerController::class, 'lookup'])->name('api.nav.taxpayer');
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
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
