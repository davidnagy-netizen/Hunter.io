<?php

namespace App\Http\Controllers\Api;

use App\Models\Opportunity;
use App\Services\Accounts;
use App\Exceptions\ApiError;
use App\Services\Catalog;
use App\Services\Profiles;
use App\Services\Scoring;
use Illuminate\Http\Request;

class CatalogController
{
    public function __construct(private Accounts $accounts, private Profiles $profiles, private Catalog $catalog, private Scoring $scoring) {}

    public function meta()
    {
        $meta = $this->catalog->metadata();
        if ($meta['eurHuf'] === null) {
            unset($meta['eurHuf']);
        }
        $programmes = Opportunity::distinct()->pluck('program')->mapWithKeys(fn ($v) => [$v => $v]);

        return response()->json(['catalog' => Opportunity::exists() ? $meta + ['counts' => ['total' => Opportunity::count(), 'open' => Opportunity::open()->count(), 'forthcoming' => Opportunity::where('status', 'forthcoming')->count()]] : null,
            'reference' => $this->profiles->reference(), 'labels' => ['programmes' => (object) $programmes->all(), 'actions' => (object) []],
            'optionalProfileFields' => array_map(fn ($f, $hu, $en) => ['field' => $f, 'weight' => 1, 'q_hu' => $hu, 'q_en' => $en,
                'opts' => [['t_hu' => 'Igen', 't_en' => 'Yes', 'v' => true], ['t_hu' => 'Nem', 't_en' => 'No', 'v' => false]]],
                ['de_minimis_ok', 'consortium_ready', 'eu_experience'], ['Van szabad de minimis kerete?', 'Készen áll konzorciumi részvételre?', 'Van EU pályázati tapasztalata?'],
                ['Do you have de minimis headroom?', 'Are you ready to join a consortium?', 'Do you have EU funding experience?']), 'today' => now('UTC')->toDateString()]);
    }

    public function index(Request $r)
    {
        $state = $this->profiles->resolve($r);
        $ent = $this->accounts->entitlements($r->user());
        $rows = $this->catalog->rows($state, $r->query('lang', 'hu'), $r->boolean('forthcoming'));
        $meta = $this->catalog->metadata() + ['entitlements' => $ent];
        // A subscriber gets every open call already scored for their company (score, verdict, checks, calculator, ...),
        // plus the same totals a gated visitor gets. The server is the only scorer; the browser just shows the result.
        if ($ent['explanations']) {
            $funding = array_values(array_filter($rows, fn ($o) => $o['awardsFunding']));

            return response()->json($meta + ['gated' => false, 'total' => count($rows), 'opportunities' => array_map(fn ($o) => $this->catalog->trim($o), $rows),
                'stats' => $this->catalog->stats($funding)]);
        }
        $rows = array_values(array_filter($rows, fn ($o) => $o['awardsFunding']));
        $eligible = array_values(array_filter($rows, fn ($o) => ! $o['blocked']));
        usort($eligible, fn ($a, $b) => $b['score'] <=> $a['score']);

        return response()->json($meta + ['gated' => true, 'total' => 0, 'lockedTotal' => count($eligible), 'opportunities' => [],
            'teasers' => array_map(fn ($o, $i) => $this->catalog->teaser($o, $i), array_slice($eligible, 0, 12), array_keys(array_slice($eligible, 0, 12))), 'stats' => $this->catalog->stats($rows)]);
    }

    public function show(Request $r, string $id)
    {
        $o = $this->catalog->opportunity($this->catalog->find($id));
        $state = $this->profiles->resolve($r);
        $full = array_replace($o, $this->scoring->score($o, $state['profile'], $state['answers'], $r->query('lang', 'hu')));
        $ent = $this->accounts->entitlements($r->user());
        if ($r->user()) {
            $this->accounts->activity($r->user(), 'opportunity.viewed', ['id' => $id, 'title' => $o['title']]);
        }

        return response()->json(['opportunity' => $ent['explanations'] ? $full : $this->catalog->locked($full), 'saved' => in_array($id, $state['saved'], true), 'entitlements' => $ent]);
    }

    public function save(Request $r, string $id)
    {
        $u = $this->accounts->requireUser($r);
        $o = $this->catalog->find($id);

        return response()->json($this->accounts->mutate($u, function (&$s) use ($id, $o) {
            $saved = ! in_array($id, $s['saved'], true);
            $s['saved'] = $saved ? [...$s['saved'], $id] : array_values(array_diff($s['saved'], [$id]));
            array_unshift($s['activity'], ['at' => now()->toISOString(), 'type' => $saved ? 'opportunity.saved' : 'opportunity.unsaved', 'id' => $id, 'title' => $o->title]);

            return ['success' => true, 'saved' => $s['saved'], 'isSaved' => $saved, 'persisted' => true];
        }));
    }

    public function answer(Request $r, string $id)
    {
        $u = $this->accounts->requireUser($r);
        $o = $this->catalog->opportunity($this->catalog->find($id));
        if (! is_string($r->input('field')) || trim($r->input('field')) === '') {
            throw new ApiError('FIELD_REQUIRED');
        }
        $r->validate(['field' => 'required|string|max:100', 'scope' => 'sometimes|in:global,call']);
        $value = $r->input('value');
        if ($value !== null && ! is_scalar($value)) {
            throw new ApiError('INVALID_REQUEST');
        }
        $key = ($r->input('scope', 'global') === 'call' ? $id.':' : '').$r->input('field');
        $this->accounts->mutate($u, function (&$s) use ($key, $value) {
            if ($value === null) {
                unset($s['answers'][$key]);
            } else {
                $s['answers'][$key] = $value;
            }
            array_unshift($s['activity'], ['at' => now()->toISOString(), 'type' => 'profile.answered', 'field' => $key]);
        });
        $full = array_replace($o, $this->scoring->score($o, $this->profiles->current($u) ?? [], $this->accounts->state($u)['answers'], $r->query('lang', 'hu')));

        return response()->json(['success' => true, 'key' => $key, 'value' => $value, 'opportunity' => $this->accounts->entitlements($u)['explanations'] ? $full : $this->catalog->locked($full)]);
    }

    public function search(Request $r, \App\Services\CatalogSearch $search)
    {
        $r->validate(['page' => 'sometimes|integer|min:1', 'pageSize' => 'sometimes|integer|min:1|max:100', 'q' => 'sometimes|nullable|string|max:500',
            'sort' => 'sometimes|nullable|in:-score,deadline,-budget', 'deadlineFrom' => 'sometimes|date_format:Y-m-d', 'deadlineTo' => 'sometimes|date_format:Y-m-d']);
        $state = $this->profiles->resolve($r);
        return response()->json($search->search($state, $r->all(), $r->query(), $r->user(), $r->isMethod('POST')));
    }
}
