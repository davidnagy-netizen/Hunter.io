<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Short-lived 6-digit codes sent by e-mail: account verification and password reset. Only a hash is kept, a code works
 * once, and five wrong tries burn it, so the sender has to ask for a new one.
 */
class EmailCodes
{
    public const MINUTES = 10;

    private const ATTEMPTS = 5;

    public function issue(string $purpose, string $subject): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires = now()->addMinutes(self::MINUTES);
        Cache::put($this->key($purpose, $subject), ['hash' => $this->hash($code), 'attempts' => 0, 'expires' => $expires->toISOString()], $expires);

        return $code;
    }

    public function check(string $purpose, string $subject, string $code): bool
    {
        $key = $this->key($purpose, $subject);
        $entry = Cache::get($key);
        if (! $entry) {
            return false;
        }
        if (hash_equals($entry['hash'], $this->hash($code))) {
            Cache::forget($key);

            return true;
        }
        if (++$entry['attempts'] >= self::ATTEMPTS) {
            Cache::forget($key);
        } else {
            Cache::put($key, $entry, Carbon::parse($entry['expires']));
        }

        return false;
    }

    private function key(string $purpose, string $subject): string
    {
        return "email-code:{$purpose}:{$subject}";
    }

    private function hash(string $code): string
    {
        return hash_hmac('sha256', $code, (string) config('app.key'));
    }
}
