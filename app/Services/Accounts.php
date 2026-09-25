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

    public function state(User $u): array
    {
        $row = DB::table('api_account_states')->where('user_id', $u->id)->first();
        $data = [];
        foreach (['answers', 'saved', 'versions', 'activity', 'subscriptions'] as $key) {
            $data[$key] = $row ? json_decode($row->$key, true) : [];
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
            DB::table('api_account_states')->updateOrInsert(['user_id' => $u->id], array_map(fn ($v) => json_encode($v, JSON_THROW_ON_ERROR), $state));

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
            'hasProfile' => $u->companyProfile()->exists()];
    }
}
