<?php

/**
 * API Routes Definition.
 *
 * Here is where you can register API routes for your application.
 * These routes are assigned the "api" middleware group.
 */

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CrmController;
use App\Models\Opportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Operational health check endpoint
Route::get('/health', [AdminController::class, 'health'])->name('api.health');

// Lightweight opportunities JSON listing
Route::get('/opportunities', function (Request $request) {
    return response()->json(Opportunity::open()->paginate(20));
})->name('api.opportunities');

// Lead capture endpoint for external landing pages / widgets
Route::post('/leads', [CrmController::class, 'store'])->name('api.leads');
