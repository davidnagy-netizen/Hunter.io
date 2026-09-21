<?php

namespace App\Http\Controllers\Api;

use App\Models\Opportunity;
use App\Services\Api\Accounts;
use App\Services\Api\ApiError;
use App\Services\Api\Catalog;
use App\Services\Api\Profiles;
use App\Services\Api\Scoring;
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
        if ($ent['explanations']) {
            return response()->json($meta + ['gated' => false, 'total' => count($rows), 'opportunities' => array_map(function ($o) {
                return $this->catalog->unscored($o);
            }, $rows)]);
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

    public function search(Request $r)
    {
        $r->validate(['page' => 'sometimes|integer|min:1', 'pageSize' => 'sometimes|integer|min:1|max:100', 'q' => 'sometimes|nullable|string|max:500',
            'sort' => 'sometimes|nullable|in:-score,deadline,-budget', 'deadlineFrom' => 'sometimes|date_format:Y-m-d', 'deadlineTo' => 'sometimes|date_format:Y-m-d']);
        $state = $this->profiles->resolve($r);
        $personalized = $r->boolean('personalized', true);
        if (! $personalized) {
            $state['profile'] = [];
        }
        $rows = $this->catalog->rows($state, $r->query('lang', 'hu'), true);
        $q = trim((string) $r->query('q', ''));
        $terms = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($q), -1, PREG_SPLIT_NO_EMPTY);
        $docs = array_map(fn ($o) => preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower(implode(' ', [$o['title'], $o['program'], $o['id'], $o['summary'] ?? '', strip_tags($o['description'] ?? '')])), -1, PREG_SPLIT_NO_EMPTY), $rows);
        $average = count($docs) ? max(1, array_sum(array_map('count', $docs)) / count($docs)) : 1;
        foreach ($rows as $i => &$row) {
            $freq = array_count_values($docs[$i]);
            $row['relevance'] = 0;
            foreach ($terms as $term) {
                $df = count(array_filter($docs, fn ($d) => in_array($term, $d, true)));
                $tf = $freq[$term] ?? 0;
                if ($tf) {
                    $row['relevance'] += log(1 + (count($docs) - $df + .5) / ($df + .5)) * $tf * 2.2 / ($tf + 1.2 * (.25 + .75 * count($docs[$i]) / $average));
                }
            }
        }
        unset($row);
        $rows = array_values(array_filter($rows, function ($o) use ($r, $terms) {
            if ($terms && $o['relevance'] <= 0) {
                return false;
            }
            if ($r->boolean('awardsFunding', true) && ! $o['awardsFunding']) {
                return false;
            }
            foreach (['program' => 'programShort', 'actionCode' => 'actionCode', 'goals' => 'goals', 'sectors' => 'sectors', 'orgType' => 'applicantTypes'] as $param => $key) {
                $raw = $r->query($param);
                if ($raw !== null && $raw !== '') {
                    $wanted = is_array($raw) ? $raw : explode(',', $raw);
                    if (! array_intersect($wanted, (array) ($o[$key] ?? []))) {
                        return false;
                    }
                }
            }
            if ($r->filled('consortium') && (($o['consortium']['required'] ?? false) !== ($r->query('consortium') === 'required'))) {
                return false;
            }
            if ($r->boolean('eligibleOnly') && $o['blocked']) {
                return false;
            }
            if ($r->filled('minScore') && ($o['score'] === null || $o['score'] < $r->integer('minScore'))) {
                return false;
            }
            if ($r->filled('deadlineFrom') && $o['deadline'] < $r->query('deadlineFrom')) {
                return false;
            }
            if ($r->filled('deadlineTo') && $o['deadline'] > $r->query('deadlineTo')) {
                return false;
            }
            if ($r->filled('budgetMin') && $o['fundingMax'] < (float) $r->query('budgetMin')) {
                return false;
            }
            if ($r->filled('budgetMax') && $o['fundingMin'] > (float) $r->query('budgetMax')) {
                return false;
            }

            return ! $r->filled('minIntensity') || $o['intensity'] >= (float) $r->query('minIntensity');
        }));
        $facets = [];
        foreach (['program' => 'programShort', 'actionCode' => 'actionCode', 'goals' => 'goals', 'sectors' => 'sectors', 'orgType' => 'applicantTypes', 'consortium' => 'consortium'] as $facet => $field) {
            $counts = [];
            foreach ($rows as $o) {
                foreach ($field === 'consortium' ? [($o['consortium']['required'] ?? false) ? 'required' : 'solo'] : array_unique((array) ($o[$field] ?? [])) as $v) {
                    if ($v !== '') {
                        $counts[$v] = ($counts[$v] ?? 0) + 1;
                    }
                }
            }
            $facets[$facet] = array_map(fn ($v, $count) => ['value' => (string) $v, 'count' => $count], array_keys($counts), array_values($counts));
        }
        $sort = $r->query('sort') ?? '';
        usort($rows, fn ($a, $b) => (match ($sort) {
            '-score' => ($b['score'] ?? -1) <=> ($a['score'] ?? -1), 'deadline' => $a['deadline'] <=> $b['deadline'], '-budget' => $b['fundingMax'] <=> $a['fundingMax'], default => $b['relevance'] <=> $a['relevance']
        }) ?: strcmp($a['id'], $b['id']));
        $total = count($rows);
        $page = $r->integer('page', 1);
        $size = $r->integer('pageSize', 20);
        $rows = array_slice($rows, ($page - 1) * $size, $size);
        $ent = $this->accounts->entitlements($r->user());
        $results = [];
        foreach ($rows as $i => $o) {
            if (! $personalized) {
                $o['score'] = null;
                $o['band'] = null;
                $o['estimated'] = false;
                $o['blocked'] = false;
                $o['verdict'] = null;
                $o['blockedReasons'] = [];
            }
            $results[] = $ent['explanations'] ? $this->catalog->trim($o) : $this->catalog->teaser($o, ($page - 1) * $size + $i);
        }
        if ($r->user() && $q !== '') {
            $this->accounts->activity($r->user(), 'search', ['q' => $q]);
        }

        return response()->json(['query' => $q, 'total' => $total, 'page' => $page, 'pageSize' => $size, 'sort' => $sort,
            'personalized' => $personalized, 'profileUsed' => $personalized && $state['profile'] ? array_intersect_key($state['profile'], array_flip(['company', 'orgType', 'goals'])) + ['fromRequest' => $r->isMethod('POST')] : null,
            'account' => $r->user() ? ['username' => $r->user()->username, 'tier' => $ent['tier']] : null,
            'entitlements' => $ent, 'facets' => (object) $facets, 'results' => $results, 'lockedCount' => $ent['explanations'] ? 0 : count($results)]);
    }
}
