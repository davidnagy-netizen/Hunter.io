<?php

namespace App\Http\Controllers\Api;

use App\Models\Opportunity;
use Illuminate\Http\JsonResponse;

/**
 * Operational health check (outside the frontend contract).
 */
class HealthController
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'service' => 'Fundor.hu Laravel API',
            'catalog' => [
                'total' => Opportunity::count(),
                'open' => Opportunity::open()->count(),
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
