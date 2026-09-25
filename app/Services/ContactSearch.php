<?php

namespace App\Services;

use Illuminate\Support\Fluent;

class ContactSearch
{
    public function filter(array $contacts, array $filters): array
    {
        $input = new Fluent($filters);
        $contacts = array_values(array_filter($contacts, function ($c) use ($input) {
            foreach (['stage', 'lifecycle', 'source', 'owner', 'kind'] as $key) {
                if ($input->filled($key) && $c[$key] !== $input->get($key)) {
                    return false;
                }
            }
            if ($input->filled('tag') && ! in_array($input->get('tag'), $c['tags'], true)) {
                return false;
            }
            $q = mb_strtolower(trim($input->get('q') ?? ''));
            if ($q !== '' && ! str_contains(mb_strtolower(implode(' ', [$c['company'], $c['username'], $c['email'], $c['contactName'], $c['profile']['projectName'] ?? '', implode(' ', $c['tags'])])), $q)) {
                return false;
            }
            if ($input->filled('minEngagement') && $c['engagement']['score'] < $input->integer('minEngagement')) {
                return false;
            }
            if ($input->has('hasOpenTask') && ($c['openTasks'] > 0) !== $input->boolean('hasOpenTask')) {
                return false;
            }
            if ($input->has('overdue') && ($c['overdueTasks'] > 0) !== $input->boolean('overdue')) {
                return false;
            }

            return true;
        }));
        usort($contacts, fn ($a, $b) => (match ($input->get('sort', 'recent')) {
            'oldest' => strcmp($a['createdAt'], $b['createdAt']), 'engagement' => $b['engagement']['score'] <=> $a['engagement']['score'],
            'value' => ($b['monthlyValueHuf'] ?? -1) <=> ($a['monthlyValueHuf'] ?? -1), 'expiring' => ($a['subscription']['validUntil'] ?? '9999') <=> ($b['subscription']['validUntil'] ?? '9999'),
            'stale' => ($b['engagement']['daysSinceActive'] ?? PHP_INT_MAX) <=> ($a['engagement']['daysSinceActive'] ?? PHP_INT_MAX),
            'company' => strcasecmp($a['company'] ?? '', $b['company'] ?? ''), default => strcmp($b['createdAt'], $a['createdAt']),
        }) ?: strcmp($a['id'], $b['id']));

        return $contacts;
    }
}
