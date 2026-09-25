<?php

namespace App\Http\Controllers\Api;

use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\User;
use App\Services\Accounts;
use App\Exceptions\ApiError;
use App\Services\Catalog;
use App\Services\CatalogRefresh;
use App\Services\Profiles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController
{
    public function __construct(private Accounts $accounts, private Catalog $catalog, private CatalogRefresh $refresh, private Profiles $profiles) {}

    public function overview(Request $r)
    {
        $this->accounts->requireUser($r, true);
        $users = User::latest()->get();
        $views = $users->map(fn ($u) => $this->accounts->user($u));
        $active = $views->filter(fn ($u) => $u['subscription']['active']);
        $activity = $users->flatMap(fn ($u) => array_map(fn ($a) => $a + ['userId' => (string) $u->id, 'username' => $u->username, 'company' => $u->company], $this->accounts->state($u)['activity']))->sortByDesc('at')->take(20)->values();
        $stats = ['users' => $users->count(), 'admins' => $users->where('role', 'admin')->count(), 'disabled' => $users->where('disabled', true)->count(),
            'activeSubscriptions' => $active->count(), 'withoutSubscription' => $views->filter(fn ($u) => $u['role'] !== 'admin' && ! $u['subscription']['active'])->count(),
            'newThisWeek' => $users->filter(fn ($u) => $u->created_at->gte(now()->subDays(7)))->count(),
            'sessions' => DB::table('api_sessions')->where('expires_at', '>', now())->count(),
            'profilesSaved' => $views->where('hasProfile', true)->count()];

        return response()->json(['stats' => $stats, 'byPlan' => (object) $active->countBy('subscription.plan')->all(),
            'expiringSoon' => $active->filter(fn ($u) => $u['subscription']['daysLeft'] <= 14)->sortBy('subscription.daysLeft')->map(fn ($u) => $u + ['daysLeft' => $u['subscription']['daysLeft']])->values(),
            'awaitingAccess' => $views->filter(fn ($u) => $u['role'] !== 'admin' && ! $u['subscription']['active'])->take(8)->values(),
            'recentSignups' => $views->take(6)->values(), 'activity' => $activity, 'plans' => $this->accounts->plans(),
            'system' => ['catalogTotal' => Opportunity::count(), 'catalogOpen' => Opportunity::open()->count(), 'builtBy' => 'Laravel', 'refresh' => $this->refresh->status()] + $this->catalog->metadata()]);
    }

    public function users(Request $r)
    {
        $overview = $this->overview($r)->getData(true);

        return response()->json(['stats' => $overview['stats'] + ['leads' => Lead::count()], 'plans' => $this->accounts->plans(),
            'users' => User::latest()->get()->map(function ($u) {
                $s = $this->accounts->state($u);

                return $this->accounts->user($u) + ['profileVersions' => count($s['versions']), 'lastActivity' => $s['activity'][0] ?? null];
            })]);
    }

    public function history(Request $r)
    {
        $this->accounts->requireUser($r, true);
        $u = User::find($r->query('userId')) ?? throw new ApiError('NO_SUCH_USER', 404);
        $s = $this->accounts->state($u);

        return response()->json(['user' => $this->accounts->user($u), 'current' => $this->profiles->current($u), 'versions' => $s['versions'], 'subscriptions' => $s['subscriptions'], 'activity' => array_slice($s['activity'], 0, 60)]);
    }

    public function subscription(Request $r)
    {
        $admin = $this->accounts->requireUser($r, true);
        $r->validate(['userId' => 'required|string', 'note' => 'sometimes|nullable|string|max:2000', 'revoke' => 'sometimes|boolean']);
        $u = User::find($r->input('userId')) ?? throw new ApiError('NO_SUCH_USER', 404);
        $plan = collect($this->accounts->plans())->firstWhere('id', $r->input('planId'));
        if (! $r->boolean('revoke') && ! $plan) {
            throw new ApiError('UNKNOWN_PLAN');
        }
        $this->accounts->mutate($u, function (&$s) use ($u, $admin, $r, $plan) {
            $u->refresh();
            $revoke = $r->boolean('revoke');
            $days = is_numeric($r->input('days')) && $r->input('days') > 0 ? min(36500, (int) ceil($r->input('days'))) : ($plan['days'] ?? 0);
            $until = $revoke ? null : ($u->subscription_expires_at?->isFuture() ? $u->subscription_expires_at->copy() : now())->addDays($days);
            $u->update(['subscription_plan' => $revoke ? null : $plan['id'], 'subscription_expires_at' => $until]);
            $entry = ['at' => now()->toISOString(), 'action' => $revoke ? 'revoked' : 'granted', 'by' => $admin->username, 'note' => $r->input('note')];
            if (! $revoke) {
                $entry += ['plan' => $plan['id'], 'days' => $days, 'validUntil' => $until->toISOString()];
            }
            array_unshift($s['subscriptions'], $entry);
            array_unshift($s['activity'], ['type' => 'subscription.'.$entry['action']] + $entry);
        });

        return response()->json(['success' => true, 'user' => $this->accounts->user($u->fresh())]);
    }

    public function patchUser(Request $r)
    {
        $admin = $this->accounts->requireUser($r, true);
        $data = $r->validate(['userId' => 'required|string', 'disabled' => 'sometimes|boolean', 'role' => 'sometimes|in:admin,user']);
        $u = User::find($data['userId']) ?? throw new ApiError('NO_SUCH_USER', 404);
        if ($u->id === $admin->id && (($data['disabled'] ?? false) || ($data['role'] ?? 'admin') !== 'admin')) {
            throw new ApiError('CANNOT_DEMOTE_SELF');
        }
        $this->accounts->mutate($u, function (&$s) use ($u, $data, $admin) {
            $u->update(array_intersect_key($data, array_flip(['disabled', 'role'])));
            if ($u->disabled) {
                DB::table('api_sessions')->where('user_id', $u->id)->delete();
                DB::table('sessions')->where('user_id', $u->id)->delete();
            }
            array_unshift($s['activity'], ['at' => now()->toISOString(), 'type' => 'account.updated', 'by' => $admin->username]);
        });

        return response()->json(['success' => true, 'user' => $this->accounts->user($u->fresh())]);
    }

    public function refresh(Request $r)
    {
        $this->accounts->requireUser($r, true);

        $result = $this->refresh->run();

        return response()->json($result, $result['ok'] ? 200 : 502);
    }
}
