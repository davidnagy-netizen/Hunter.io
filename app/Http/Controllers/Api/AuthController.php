<?php

namespace App\Http\Controllers\Api;

use App\Models\Lead;
use App\Models\User;
use App\Services\Api\Accounts;
use App\Services\Api\ApiError;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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
        if (! is_string($r->input('username')) || ! preg_match('/^[a-zA-Z0-9._-]{3,32}$/D', $r->input('username'))) {
            throw new ApiError('INVALID_USERNAME');
        }
        if (! is_string($r->input('password')) || mb_strlen($r->input('password')) < 4) {
            throw new ApiError('WEAK_PASSWORD');
        }
        $data = $r->validate(['username' => 'required|string', 'password' => 'required|string|max:1024', 'company' => 'nullable|string|max:255', 'email' => 'nullable|email|max:200']);
        if (User::where('username', $data['username'])->exists()) {
            throw new ApiError('USERNAME_TAKEN', 409);
        }
        if (! empty($data['email']) && User::where('email', $data['email'])->exists()) {
            throw new ApiError('EMAIL_TAKEN', 409);
        }
        try {
            $u = DB::transaction(function () use ($data) {
                $u = User::create($data + ['name' => $data['username'], 'role' => 'user', 'last_login_at' => now()]);
                $this->accounts->activity($u, 'account.created');
                if (! empty($data['email'])) {
                    $count = Lead::whereRaw('LOWER(email) = ?', [mb_strtolower($data['email'])])->whereNull('user_id')->update(['user_id' => $u->id]);
                    if ($count) {
                        $this->accounts->activity($u, 'crm.lead_converted');
                    }
                }

                return $u;
            });
        } catch (UniqueConstraintViolationException $e) {
            throw new ApiError(User::where('username', $data['username'])->exists() ? 'USERNAME_TAKEN' : 'EMAIL_TAKEN', 409);
        }

        return $this->session($r, $u->fresh(), 201);
    }

    public function login(Request $r)
    {
        $data = $r->validate(['username' => 'required|string', 'password' => 'required|string']);
        $u = User::where('username', $data['username'])->first();
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
        if ($old = $r->cookie('hunter_session')) {
            DB::table('api_sessions')->where('token_hash', hash('sha256', $old))->delete();
        }
        $token = bin2hex(random_bytes(32));
        DB::table('api_sessions')->insert(['token_hash' => hash('sha256', $token), 'user_id' => $u->id, 'expires_at' => now()->addMinutes(config('fundor.session_minutes'))]);

        return response()->json(['success' => true, 'user' => $this->accounts->user($u)], $status)
            ->cookie('hunter_session', $token, config('fundor.session_minutes'), '/', null, config('fundor.cookie_secure'), true, false, 'lax');
    }

    public function logout(Request $r)
    {
        if ($token = $r->cookie('hunter_session')) {
            DB::table('api_sessions')->where('token_hash', hash('sha256', $token))->delete();
        }

        return response()->json(['success' => true])->withoutCookie('hunter_session');
    }
}
