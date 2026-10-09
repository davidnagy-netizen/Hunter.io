<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Notifications\PasswordResetCode;
use App\Services\Accounts;
use App\Services\EmailCodes;
use App\Exceptions\ApiError;
use Illuminate\Http\Request;
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

    public function register(Request $r, \App\Actions\Company\RegisterCompany $action)
    {
        $data = $r->validate([
            'name' => 'required|string|max:255', 'email' => 'required|email|max:200',
            'password' => 'required|string|min:12|max:128|confirmed',
            'verification_receipt' => 'required|string|max:30000',
            'accept_terms' => 'required|accepted', 'accept_privacy' => 'required|accepted',
            'marketing_opt_in' => 'sometimes|boolean', 'metrics' => 'required|array',
        ]);
        $u = $action->execute($data + ['lang' => $this->lang($r)], $r->cookie('fundor_signup'));

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

    /** "Forgot password?": e-mails a code. The same answer whether or not the address has an account. */
    public function forgotPassword(Request $r, EmailCodes $codes)
    {
        $email = mb_strtolower(trim($r->validate(['email' => 'required|email|max:200'])['email']));
        $u = User::whereRaw('LOWER(email) = ?', [$email])->first();
        if ($u && ! $u->disabled) {
            $u->notify((new PasswordResetCode($codes->issue('password', (string) $u->id)))->locale($this->lang($r)));
        }

        return response()->json(['success' => true]);
    }

    /** Sets the new password with the e-mailed code and signs the account out everywhere. */
    public function resetPassword(Request $r, EmailCodes $codes)
    {
        $data = $r->validate(['email' => 'required|email|max:200', 'code' => 'required|string|size:6',
            'password' => 'required|string|min:12|max:128|confirmed']);
        $u = User::whereRaw('LOWER(email) = ?', [mb_strtolower(trim($data['email']))])->first();
        if (! $u || $u->disabled || ! $codes->check('password', (string) $u->id, $data['code'])) {
            throw new ApiError('INVALID_CODE', 422);
        }
        $u->update(['password' => $data['password']]);
        DB::table('api_sessions')->where('user_id', $u->id)->delete();
        $this->accounts->activity($u, 'account.password_changed');

        return response()->json(['success' => true]);
    }

    /** The site language the request came from (`?lang=`), which the e-mails it triggers are written in. */
    private function lang(Request $r): string
    {
        return $r->query('lang') === 'en' ? 'en' : 'hu';
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
