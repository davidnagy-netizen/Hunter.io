<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ValidateTaxpayerRequest;
use App\Services\Nav\NavTaxpayerService;
use Illuminate\Http\JsonResponse;

/**
 * Controller: On-Demand NAV Taxpayer Verification Endpoint.
 *
 * Reference: CR-03 Section 4.3 - NAV queryTaxpayer Service & Progressive Registration Flow.
 *
 * Responsibilities:
 * 1. Receives client requests with a Hungarian tax number.
 * 2. Runs FormRequest validation (including CDV checksum).
 * 3. Invocates NavTaxpayerService to retrieve official company name and seat address.
 * 4. Returns read-only confirmation data for the frontend registration wizard.
 */
class NavTaxpayerController extends Controller
{
    /**
     * @param  NavTaxpayerService  $navService  Service handling NAV integration and caching.
     */
    public function __construct(
        private readonly NavTaxpayerService $navService
    ) {}

    /**
     * Look up official Hungarian taxpayer details by tax number.
     */
    public function lookup(ValidateTaxpayerRequest $request): JsonResponse
    {
        $taxNumber = $request->getCleanTaxNumber();

        try {
            $taxpayer = $this->navService->queryTaxpayer($taxNumber);

            return response()->json([
                'success' => true,
                'taxpayer' => $taxpayer->toArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'code' => 'TAXPAYER_LOOKUP_FAILED',
            ], 422);
        }
    }
}
