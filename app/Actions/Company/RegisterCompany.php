<?php

declare(strict_types=1);

namespace App\Actions\Company;

use App\Models\Lead;
use App\Models\User;
use App\Notifications\VerifyAccountEmail;
use App\Exceptions\ApiError;
use App\Services\Accounts;
use App\Services\CompanyMetrics;
use App\Services\Profiles;
use App\Services\Registration\SignupVerification;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class RegisterCompany
{
    public function __construct(private Accounts $accounts) {}

    public function execute(array $data, ?string $signupToken): User
    {
        $metrics = app(CompanyMetrics::class)->validate($data['metrics']);
        $email = mb_strtolower(trim($data['email']));
        try {
            $u = DB::transaction(function () use ($signupToken, $data, $metrics, $email) {
                $identity = app(SignupVerification::class)->consume($data['verification_receipt'], $signupToken);
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

        return $u;
    }
}
