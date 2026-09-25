<?php

declare(strict_types=1);

namespace App\Services\Registration;

use App\Exceptions\ApiError;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/** CR-03: encrypted client receipt; the server retains only expiring nonce metadata. */
final class SignupVerification
{
    /** Issue or resume a random signup capability, independent of account sessions. */
    public function session(?string $token): string
    {
        if (is_string($token) && preg_match('/^[a-f0-9]{64}$/D', $token)
            && DB::table('signup_sessions')->where('token_hash', hash('sha256', $token))->where('expires_at', '>', now())->exists()) {
            return $token;
        }
        $token = bin2hex(random_bytes(32));
        DB::table('signup_sessions')->insert(['token_hash' => hash('sha256', $token), 'expires_at' => now()->addMinutes(30)]);

        return $token;
    }

    /** Replacing the nonce invalidates earlier receipts from this session. */
    public function issue(string $token, array $identity): string
    {
        $nonce = bin2hex(random_bytes(32));
        DB::table('signup_sessions')->where('token_hash', hash('sha256', $token))
            ->update(['nonce_hash' => hash('sha256', $nonce), 'expires_at' => now()->addMinutes(30)]);

        return Crypt::encryptString(json_encode(['session' => hash('sha256', $token), 'nonce' => $nonce,
            'expires' => now()->addMinutes(30)->timestamp, 'identity' => $identity], JSON_THROW_ON_ERROR));
    }

    /** Consume inside the registration transaction so failures do not burn a valid receipt. */
    public function consume(string $receipt, ?string $token): array
    {
        try {
            $data = json_decode(Crypt::decryptString($receipt), true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            throw new ApiError('VERIFICATION_EXPIRED', 422);
        }
        $hash = hash('sha256', (string) $token);
        if (! is_array($data) || ! isset($data['session'], $data['expires'], $data['nonce'], $data['identity'])
            || ! hash_equals($hash, $data['session']) || $data['expires'] <= now()->timestamp) {
            throw new ApiError('VERIFICATION_EXPIRED', 422);
        }
        $deleted = DB::table('signup_sessions')->where('token_hash', $hash)
            ->where('nonce_hash', hash('sha256', $data['nonce']))->where('expires_at', '>', now())->delete();
        if ($deleted !== 1) {
            throw new ApiError('VERIFICATION_EXPIRED', 422);
        }

        return $data['identity'];
    }
}
