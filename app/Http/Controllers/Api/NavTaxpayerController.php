<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DTOs\TaxpayerData;
use App\Http\Requests\TaxpayerLookupRequest;
use App\Services\Api\ApiError;
use App\Services\Nav\NavTaxpayerService;
use App\Services\Nav\SignupVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\RateLimiter;

/** On-demand lookups are limited by both session and IP; authenticated caches are owner-scoped. */
class NavTaxpayerController
{
    public function __construct(private NavTaxpayerService $nav, private SignupVerification $verification) {}

    public function lookup(TaxpayerLookupRequest $request): JsonResponse
    {
        $ipKey = 'nav-ip:'.hash('sha256', $request->ip() ?? '');
        if (RateLimiter::tooManyAttempts($ipKey, 20)) {
            throw new ApiError('LOOKUP_THROTTLED', 429);
        }
        RateLimiter::hit($ipKey, 3600);
        $token = $this->verification->session($request);
        $sessionHash = hash('sha256', $token);
        foreach (['nav-session:'.$sessionHash => [5, 60]] as $key => [$limit, $seconds]) {
            if (RateLimiter::tooManyAttempts($key, $limit)) {
                throw new ApiError('LOOKUP_THROTTLED', 429);
            }
            RateLimiter::hit($key, $seconds);
        }
        $lock = Cache::lock('nav-flight:'.$sessionHash, 40);
        if (! $lock->get()) {
            throw new ApiError('LOOKUP_THROTTLED', 429);
        }
        try {
            $number = (string) $request->input('tax_number');
            $profile = $request->user()?->companyProfile;
            if ($request->user()) {
                $hash = hash_hmac('sha256', substr(str_replace('-', '', $number), 0, 8), config('app.key'));
                if (! $profile || ! hash_equals($profile->tax_base_hash ?? '', $hash)) {
                    throw new ApiError('ORGANIZATION_MISMATCH', 403);
                }
                $key = 'nav-owner:'.$request->user()->id;
                $encrypted = Cache::remember($key, now()->addHours(24), fn () => Crypt::encryptString(json_encode($this->nav->queryTaxpayer($number)->toArray(), JSON_THROW_ON_ERROR)));
                $data = json_decode(Crypt::decryptString($encrypted), true, flags: JSON_THROW_ON_ERROR);
            } else {
                $data = $this->nav->queryTaxpayer($number)->toArray();
            }
            $dto = new TaxpayerData($data['tax_number'], $data['company_name'], $data['short_name'], $data['vat_group_membership']['group_id'], $data['registered_seat_address'], $data['incorporation']);

            return response()->json([
                'data' => $data, 'verification_receipt' => $this->verification->issue($token, $data),
                'expires_at' => now()->addMinutes(30)->toISOString(),
                // The old route remains a presentation adapter, with identical security controls.
                ...($request->is('api/nav/taxpayer') ? ['success' => true, 'taxpayer' => $dto->legacy()] : []),
            ])->cookie('fundor_signup', $token, 30, '/', null, config('fundor.cookie_secure'), true, false, 'strict');
        } finally {
            $lock->release();
        }
    }
}
