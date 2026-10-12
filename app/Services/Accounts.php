<?php

namespace App\Services;

use App\Exceptions\ApiError;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class Accounts
{
    public function requireUser(Request $r, bool $admin = false): User
    {
        $u = $r->user();
        if (! $u) {
            throw new ApiError('LOGIN_REQUIRED', 401);
        }
        if ($admin && ! $u->isAdmin()) {
            throw new ApiError('ADMIN_REQUIRED', 403);
        }

        return $u;
    }

    public function plans(): array
    {
        return array_map(function ($p) {
            if (isset($p['priceHUF'])) {
                $p['priceHUF'] = (float) $p['priceHUF'];
            } else {
                unset($p['priceHUF']);
            }

            return $p;
        }, config('fundor.plans'));
    }

    /** Saved calls, answers and profile history belong to the company being worked on; activity and subscriptions to the account. */
    private const COMPANY_KEYS = ['answers', 'saved', 'versions'];

    public function state(User $u): array
    {
        $row = DB::table('api_account_states')->where('user_id', $u->id)->first();
        $company = $u->companyProfile()->first();
        $data = [];
        foreach (['answers', 'saved', 'versions', 'activity', 'subscriptions'] as $key) {
            $json = $company && in_array($key, self::COMPANY_KEYS, true) ? $company->getRawOriginal($key) : $row?->$key;
            $data[$key] = $json ? json_decode($json, true) : [];
        }

        return $data;
    }

    // Serialize account mutations on the existing user row, including the first write.
    public function mutate(User $u, callable $change): mixed
    {
        return DB::transaction(function () use ($u, $change) {
            User::whereKey($u->id)->lockForUpdate()->firstOrFail();
            $state = $this->state($u);
            $result = $change($state);
            $json = array_map(fn ($v) => json_encode($v, JSON_THROW_ON_ERROR), $state);
            // Asked after the change, which may have just created or chosen the company.
            if ($company = $u->companyProfile()->first()) {
                DB::table('company_profiles')->where('id', $company->id)->update(array_intersect_key($json, array_flip(self::COMPANY_KEYS)));
                $json = array_replace($json, array_fill_keys(self::COMPANY_KEYS, '[]'));
            }
            DB::table('api_account_states')->updateOrInsert(['user_id' => $u->id], $json);

            return $result;
        });
    }

    public function activity(User $u, string $type, array $detail = []): void
    {
        $this->mutate($u, function (&$s) use ($type, $detail) {
            array_unshift($s['activity'], ['at' => now()->toISOString(), 'type' => $type] + $detail);
        });
    }

    public function entitlements(?User $u): array
    {
        $full = $u && ! $u->disabled && (! $u->verification_required || $u->hasVerifiedEmail()) && $u->hasActiveSubscription();

        return ['tier' => ! $u ? 'anonymous' : ($u->isAdmin() ? 'admin' : ($full ? 'subscriber' : 'registered')),
            'maxResults' => $full ? null : 0, 'explanations' => (bool) $full, 'calculator' => (bool) $full,
            'applyLinks' => (bool) $full, 'exportData' => (bool) $full, 'admin' => (bool) $u?->isAdmin()]
            + ($full ? [] : ['teasers' => 12]);
    }

    public function subscription(User $u): array
    {
        $last = $this->state($u)['subscriptions'][0] ?? [];

        return ['status' => ! $u->subscription_plan ? 'none' : ($u->subscription_plan === 'trial' ? 'trial' : 'active'),
            'plan' => $u->subscription_plan, 'validUntil' => $u->subscription_expires_at?->toISOString(),
            'active' => ! $u->disabled && (bool) $u->subscription_expires_at?->isFuture(),
            'daysLeft' => $u->subscription_expires_at ? (int) ceil(now()->diffInDays($u->subscription_expires_at, false)) : null,
            'grantedBy' => $last['by'] ?? null, 'grantedAt' => $last['at'] ?? null, 'note' => $last['note'] ?? null];
    }

    public function user(User $u): array
    {
        return ['id' => (string) $u->id, 'username' => $u->username, 'email' => $u->email, 'company' => $u->company,
            'emailVerified' => ! $u->verification_required || $u->hasVerifiedEmail(),
            'metricsComplete' => (bool) $u->companyProfile?->metrics_complete,
            'role' => $u->role, 'createdAt' => $u->created_at->toISOString(), 'lastLoginAt' => $u->last_login_at?->toISOString(),
            'disabled' => $u->disabled, 'subscription' => $this->subscription($u), 'entitlements' => $this->entitlements($u),
            'hasProfile' => $u->companyProfile()->exists(), 'companies' => $this->companies($u), 'profileLimit' => $u->profile_limit ?? 2];
    }

    /** The account's company profiles, oldest first, and which one it is working on. */
    private function companies(User $u): array
    {
        $active = $u->companyProfile()->value('id');

        return $u->companyProfiles()->orderBy('id')->get()->map(fn ($p) => ['id' => (string) $p->id,
            'name' => $p->nav_identity['company_name'] ?? $p->company_name, 'active' => (string) $p->id === (string) $active])->all();
    }
}
