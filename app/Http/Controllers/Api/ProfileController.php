<?php

namespace App\Http\Controllers\Api;

use App\Services\Api\Accounts;
use App\Services\Api\ApiError;
use App\Services\Api\CatalogRefresh;
use App\Services\Api\Profiles;
use Illuminate\Http\Request;

class ProfileController
{
    public function __construct(private Accounts $accounts, private Profiles $profiles) {}

    public function show(Request $r)
    {
        $u = $this->accounts->requireUser($r);
        $s = $this->accounts->state($u);

        return response()->json(['profile' => $this->profiles->current($u), 'answers' => (object) $s['answers'], 'saved' => $s['saved'],
            'demoProfile' => $this->profiles->demo(), 'versions' => count($s['versions']), 'lastEuSync' => app(CatalogRefresh::class)->status()['lastSuccessAt'] ?? null]);
    }

    public function save(Request $r)
    {
        $u = $this->accounts->requireUser($r);
        $r->validate(['profile' => 'required|array', 'source' => 'sometimes|string|max:255']);

        return response()->json($this->profiles->save($u, $r->input('profile'), $r->input('source', 'profile form')));
    }

    public function demo()
    {
        return response()->json(['success' => true, 'profile' => $this->profiles->demo()]);
    }

    public function history(Request $r)
    {
        $u = $this->accounts->requireUser($r);
        $s = $this->accounts->state($u);

        return response()->json(['current' => $this->profiles->current($u), 'versions' => $s['versions'], 'activity' => array_slice($s['activity'], 0, 40)]);
    }

    public function restore(Request $r)
    {
        $u = $this->accounts->requireUser($r);
        $r->validate(['version' => 'required|integer|min:1']);
        $v = collect($this->accounts->state($u)['versions'])->firstWhere('version', $r->integer('version'));
        if (! $v) {
            throw new ApiError('NO_SUCH_VERSION', 404);
        }
        $result = $this->profiles->save($u, $v['profile'], 'restore '.$v['version'], 'profile.restored');

        return response()->json($result + ['versions' => $this->accounts->state($u)['versions']]);
    }
}
