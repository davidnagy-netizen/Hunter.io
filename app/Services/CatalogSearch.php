<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Fluent;

class CatalogSearch
{
    public function __construct(private Accounts $accounts, private Catalog $catalog) {}

    public function search(array $state, array $input, array $query, ?User $user, bool $fromRequest): array
    {
        $input = new Fluent($input);
        $query = new Fluent($query);
        $personalized = $input->boolean('personalized', true);
        if (! $personalized) {
            $state['profile'] = [];
        }
        $rows = $this->catalog->rows($state, $query->get('lang', 'hu'), true);
        $q = trim((string) $query->get('q', ''));
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
        $rows = array_values(array_filter($rows, function ($o) use ($input, $query, $terms) {
            if ($terms && $o['relevance'] <= 0) {
                return false;
            }
            if ($input->boolean('awardsFunding', true) && ! $o['awardsFunding']) {
                return false;
            }
            foreach (['program' => 'programShort', 'actionCode' => 'actionCode', 'goals' => 'goals', 'sectors' => 'sectors', 'orgType' => 'applicantTypes'] as $param => $key) {
                $raw = $query->get($param);
                if ($raw !== null && $raw !== '') {
                    $wanted = is_array($raw) ? $raw : explode(',', $raw);
                    if (! array_intersect($wanted, (array) ($o[$key] ?? []))) {
                        return false;
                    }
                }
            }
            if ($input->filled('consortium') && (($o['consortium']['required'] ?? false) !== ($query->get('consortium') === 'required'))) {
                return false;
            }
            if ($input->boolean('eligibleOnly') && $o['blocked']) {
                return false;
            }
            if ($input->filled('minScore') && ($o['score'] === null || $o['score'] < $input->integer('minScore'))) {
                return false;
            }
            if ($input->filled('deadlineFrom') && $o['deadline'] < $query->get('deadlineFrom')) {
                return false;
            }
            if ($input->filled('deadlineTo') && $o['deadline'] > $query->get('deadlineTo')) {
                return false;
            }
            if ($input->filled('budgetMin') && $o['fundingMax'] < (float) $query->get('budgetMin')) {
                return false;
            }
            if ($input->filled('budgetMax') && $o['fundingMin'] > (float) $query->get('budgetMax')) {
                return false;
            }

            return ! $input->filled('minIntensity') || $o['intensity'] >= (float) $query->get('minIntensity');
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
        $sort = $query->get('sort') ?? '';
        usort($rows, fn ($a, $b) => (match ($sort) {
            '-score' => ($b['score'] ?? -1) <=> ($a['score'] ?? -1), 'deadline' => $a['deadline'] <=> $b['deadline'], '-budget' => $b['fundingMax'] <=> $a['fundingMax'], default => $b['relevance'] <=> $a['relevance']
        }) ?: strcmp($a['id'], $b['id']));
        $total = count($rows);
        $page = $input->integer('page', 1);
        $size = $input->integer('pageSize', 20);
        $rows = array_slice($rows, ($page - 1) * $size, $size);
        $ent = $this->accounts->entitlements($user);
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
        if ($user && $q !== '') {
            $this->accounts->activity($user, 'search', ['q' => $q]);
        }

        return ['query' => $q, 'total' => $total, 'page' => $page, 'pageSize' => $size, 'sort' => $sort,
            'personalized' => $personalized, 'profileUsed' => $personalized && $state['profile'] ? array_intersect_key($state['profile'], array_flip(['company', 'orgType', 'goals'])) + ['fromRequest' => $fromRequest] : null,
            'account' => $user ? ['username' => $user->username, 'tier' => $ent['tier']] : null,
            'entitlements' => $ent, 'facets' => (object) $facets, 'results' => $results, 'lockedCount' => $ent['explanations'] ? 0 : count($results)];
    }
}
