<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Notifications\VerifyAccountEmail;
use App\Services\Api\Accounts;
use App\Services\Api\ApiError;
use App\Services\Api\Profiles;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/** CR-03: owner-only verification and personal-data lifecycle endpoints. */
class AccountPrivacyController
{
    public function __construct(private Accounts $accounts) {}

    public function resend(Request $r)
    {
        $u = $this->accounts->requireUser($r);
        if (! $u->hasVerifiedEmail()) {
            $u->notify(new VerifyAccountEmail);
        }

        return response()->json(['success' => true]);
    }

    public function verify(Request $r, string $id, string $hash)
    {
        $u = $this->accounts->requireUser($r);
        if ((string) $u->id !== $id || ! hash_equals(sha1($u->getEmailForVerification()), $hash)) {
            throw new ApiError('VERIFICATION_INVALID', 403);
        }
        if (! $u->hasVerifiedEmail()) {
            $u->markEmailAsVerified();
            event(new Verified($u));
        }

        return redirect('/app');
    }

    public function export(Request $r, Profiles $profiles)
    {
        $u = $this->accounts->requireUser($r);

        return response()->json(['account' => $this->accounts->user($u), 'profile' => $profiles->current($u),
            'official_identity' => $u->companyProfile?->nav_identity,
            'history' => $this->accounts->state($u),
            'consents' => DB::table('account_consents')->where('user_id', $u->id)->get(),
            'leads' => $u->leads()->get(),
            'crm' => DB::table('api_crm_records')->where('subject_id', (string) $u->id)->get(),
        ])->header('Content-Disposition', 'attachment; filename="fundor-personal-data.json"');
    }

    public function erase(Request $r)
    {
        $u = $this->accounts->requireUser($r);
        $r->validate(['password' => 'required|string']);
        if (! Hash::check($r->input('password'), $u->password)) {
            throw new ApiError('BAD_CREDENTIALS', 403);
        }
        DB::transaction(function () use ($u) {
            foreach ($u->leads as $lead) {
                DB::table('api_crm_records')->where('subject_id', 'lead:'.$lead->id)->delete();
                $lead->delete();
            }
            DB::table('api_crm_records')->where('subject_id', (string) $u->id)->delete();
            DB::table('sessions')->where('user_id', $u->id)->delete();
            DB::table('password_reset_tokens')->where('email', $u->email)->delete();
            $u->delete();
        });
        Cache::forget('nav-owner:'.$u->id);

        return response()->json(['success' => true])->withoutCookie('fundor_session')->withoutCookie('fundor_signup');
    }
}
