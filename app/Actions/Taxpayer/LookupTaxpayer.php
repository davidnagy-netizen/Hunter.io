<?php

declare(strict_types=1);

namespace App\Actions\Taxpayer;

use App\Models\User;
use App\Exceptions\ApiError;
use App\Integrations\NAV\NavClient;
use App\Services\Registration\SignupVerification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\RateLimiter;

class LookupTaxpayer
{
    public function __construct(private NavClient $nav, private SignupVerification $verification) {}

    /** @return array{data: array, verification_receipt: string, expires_at: string, signup_token: string} */
    public function execute(string $number, ?User $user, ?string $signupToken, ?string $ip): array
    {
        $ipKey = 'nav-ip:'.hash('sha256', $ip ?? '');
        if (RateLimiter::tooManyAttempts($ipKey, 20)) {
            throw new ApiError('LOOKUP_THROTTLED', 429);
        }
        RateLimiter::hit($ipKey, 3600);
        $token = $this->verification->session($signupToken);
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
            $profile = $user?->companyProfile;
            if ($user) {
                $hash = hash_hmac('sha256', substr(str_replace('-', '', $number), 0, 8), config('app.key'));
                if (! $profile || ! hash_equals($profile->tax_base_hash ?? '', $hash)) {
                    throw new ApiError('ORGANIZATION_MISMATCH', 403);
                }
                $key = 'nav-owner:'.$user->id;
                $encrypted = Cache::remember($key, now()->addHours(24), fn () => Crypt::encryptString(json_encode($this->nav->queryTaxpayer($number)->toArray(), JSON_THROW_ON_ERROR)));
                $data = json_decode(Crypt::decryptString($encrypted), true, flags: JSON_THROW_ON_ERROR);
            } else {
                $data = $this->nav->queryTaxpayer($number)->toArray();
            }

            return ['data' => $data, 'verification_receipt' => $this->verification->issue($token, $data),
                'expires_at' => now()->addMinutes(30)->toISOString(), 'signup_token' => $token];
        } finally {
            $lock->release();
        }
    }
}
