<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Notifications\VerifyAccountEmail;
use App\Services\Accounts;
use App\Exceptions\ApiError;
use App\Services\EmailCodes;
use App\Services\Profiles;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/** CR-03: owner-only verification and personal-data lifecycle endpoints. */
class AccountPrivacyController
{
    public function __construct(private Accounts $accounts) {}

    public function resend(Request $r, EmailCodes $codes)
    {
        $u = $this->accounts->requireUser($r);
        if (! $u->hasVerifiedEmail()) {
            $u->notify((new VerifyAccountEmail($codes->issue('verify', (string) $u->id)))->locale($r->query('lang') === 'en' ? 'en' : 'hu'));
        }

        return response()->json(['success' => true]);
    }

    public function verify(Request $r, EmailCodes $codes)
    {
        $u = $this->accounts->requireUser($r);
        $code = $r->validate(['code' => 'required|string|size:6'])['code'];
        if (! $u->hasVerifiedEmail()) {
            if (! $codes->check('verify', (string) $u->id, $code)) {
                throw new ApiError('INVALID_CODE', 422);
            }
            $u->markEmailAsVerified();
            event(new Verified($u));
        }

        return response()->json(['success' => true]);
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

    public function erase(Request $r, \App\Actions\Accounts\EraseAccount $action)
    {
        $u = $this->accounts->requireUser($r);
        $r->validate(['password' => 'required|string']);
        if (! Hash::check($r->input('password'), $u->password)) {
            throw new ApiError('BAD_CREDENTIALS', 403);
        }
        $action->execute($u);

        return response()->json(['success' => true])->withoutCookie('fundor_session')->withoutCookie('fundor_signup');
    }
}
