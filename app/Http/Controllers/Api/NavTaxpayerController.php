<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Actions\Taxpayer\LookupTaxpayer;
use App\Http\Requests\TaxpayerLookupRequest;
use App\Integrations\NAV\DTOs\TaxpayerData;
use Illuminate\Http\JsonResponse;

class NavTaxpayerController
{
    public function lookup(TaxpayerLookupRequest $request, LookupTaxpayer $action): JsonResponse
    {
        $result = $action->execute((string) $request->input('tax_number'), $request->user(), $request->cookie('fundor_signup'), $request->ip());
        $token = $result['signup_token'];
        unset($result['signup_token']);
        if ($request->is('api/nav/taxpayer')) {
            $data = $result['data'];
            $dto = new TaxpayerData($data['tax_number'], $data['company_name'], $data['short_name'], $data['vat_group_membership']['group_id'], $data['registered_seat_address'], $data['incorporation']);
            $result += ['success' => true, 'taxpayer' => $dto->legacy()];
        }

        return response()->json($result)->cookie('fundor_signup', $token, 30, '/', null, config('fundor.cookie_secure'), true, false, 'strict');
    }
}
