<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\Lead;
use App\Models\User;
use App\Notifications\VerifyAccountEmail;
use App\Services\Api\Accounts;
use App\Services\Api\ApiError;
use App\Services\Api\CompanyMetrics;
use App\Services\Api\Profiles;
use App\Services\Nav\SignupVerification;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/** CR-03 registration binds official identity, metrics and explicit consent atomically. */
class AuthController
{
    public function __construct(private Accounts $accounts) {}

    public function me(Request $r)
    {
        return response()->json(['user' => $r->user() ? $this->accounts->user($r->user()) : null,
            'entitlements' => $this->accounts->entitlements($r->user()), 'plans' => $this->accounts->plans()]);
    }

    public function register(Request $r)
    {
        $data = $r->validate([
            'name' => 'required|string|max:255', 'email' => 'required|email|max:200',
            'password' => 'required|string|min:12|max:128|confirmed',
            'verification_receipt' => 'required|string|max:30000',
            'accept_terms' => 'required|accepted', 'accept_privacy' => 'required|accepted',
            'marketing_opt_in' => 'sometimes|boolean', 'metrics' => 'required|array',
        ]);
        $metrics = app(CompanyMetrics::class)->validate($data['metrics']);
        $email = mb_strtolower(trim($data['email']));
        try {
            $u = DB::transaction(function () use ($r, $data, $metrics, $email) {
                $identity = app(SignupVerification::class)->consume($r);
                if ($identity['incorporation'] === 'SELF_EMPLOYED' && $metrics['legal_form'] !== 'ev') {
                    throw new ApiError('LEGAL_FORM_MISMATCH', 422);
                }
                $u = User::create(['username' => 'f_'.bin2hex(random_bytes(12)), 'name' => $data['name'],
                    'email' => $email, 'password' => $data['password'], 'role' => 'user',
                    'verification_required' => true, 'last_login_at' => now()]);
                app(Profiles::class)->save($u, $metrics + ['company' => $metrics['legal_form'] === 'ev' ? 'Egyéni vállalkozó' : $identity['company_name'],
                    'industryId' => '', 'revBand' => '', 'goals' => [], 'funding_pref' => []], 'registration');
                $u->companyProfile()->update([
                    'nav_identity' => Crypt::encryptString(json_encode($identity, JSON_THROW_ON_ERROR)),
                    'tax_base_hash' => hash_hmac('sha256', substr($identity['tax_number'], 0, 8), config('app.key')),
                    // Sole-trader identity is exclusively in the encrypted NAV payload.
                    'company_name' => $metrics['legal_form'] === 'ev' ? 'Egyéni vállalkozó' : $identity['company_name'],
                ]);
                DB::table('account_consents')->insert(['user_id' => $u->id, 'document_version' => 'rev2-2026-09',
                    'terms' => true, 'privacy' => true, 'marketing' => $data['marketing_opt_in'] ?? false, 'accepted_at' => now()]);
                $this->accounts->activity($u, 'account.created');
                Lead::whereRaw('LOWER(email) = ?', [$email])->whereNull('user_id')->update(['user_id' => $u->id]);

                return $u;
            });
        } catch (UniqueConstraintViolationException) {
            throw new ApiError('EMAIL_TAKEN', 409);
        }
        // Queue after commit: mail transport failure must not roll back an already-created account.
        $u->notify(new VerifyAccountEmail);

        return $this->session($r, $u->fresh(), 201)->withoutCookie('fundor_signup');
    }

    public function login(Request $r)
    {
        $data = $r->validate(['username' => 'required|string', 'password' => 'required|string']);
        $u = User::where('username', $data['username'])->orWhereRaw('LOWER(email) = ?', [mb_strtolower($data['username'])])->first();
        if (! $u || ! Hash::check($data['password'], $u->password)) {
            throw new ApiError('BAD_CREDENTIALS', 401);
        }
        if ($u->disabled) {
            throw new ApiError('ACCOUNT_DISABLED', 403);
        }
        $u->update(['last_login_at' => now()]);
        $this->accounts->activity($u, 'account.login');

        return $this->session($r, $u);
    }

    private function session(Request $r, User $u, int $status = 200)
    {
        if ($old = $r->cookie('fundor_session')) {
            DB::table('api_sessions')->where('token_hash', hash('sha256', $old))->delete();
        }
        $token = bin2hex(random_bytes(32));
        DB::table('api_sessions')->insert(['token_hash' => hash('sha256', $token), 'user_id' => $u->id, 'expires_at' => now()->addMinutes(config('fundor.session_minutes'))]);

        return response()->json(['success' => true, 'user' => $this->accounts->user($u)], $status)
            ->cookie('fundor_session', $token, config('fundor.session_minutes'), '/', null, config('fundor.cookie_secure'), true, false, 'lax');
    }

    public function logout(Request $r)
    {
        if ($token = $r->cookie('fundor_session')) {
            DB::table('api_sessions')->where('token_hash', hash('sha256', $token))->delete();
        }

        return response()->json(['success' => true])->withoutCookie('fundor_session');
    }
}
