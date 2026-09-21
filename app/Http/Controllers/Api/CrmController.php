<?php

namespace App\Http\Controllers\Api;

use App\Models\Lead;
use App\Models\User;
use App\Services\Api\Accounts;
use App\Services\Api\ApiError;
use App\Services\Api\Crm;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CrmController
{
    public function __construct(private Accounts $accounts, private Crm $crm) {}

    public function board(Request $r)
    {
        $this->accounts->requireUser($r, true);

        return response()->json($this->crm->board());
    }

    public function leads(Request $r)
    {
        $this->accounts->requireUser($r, true);

        return response()->json(['leads' => Lead::latest()->get()->map(fn ($s) => $this->crm->contact($s)), 'vocabulary' => $this->crm->vocabulary()]);
    }

    public function contact(Request $r)
    {
        $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string']);

        return response()->json($this->crm->detail($this->crm->subject($r->input('id'))));
    }

    public function updateContact(Request $r)
    {
        $admin = $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string', 'stage' => 'sometimes|string', 'owner' => 'sometimes|nullable|string',
            'tags' => 'sometimes|array', 'tags.*' => 'string', 'source' => 'sometimes|nullable|in:assessment,signup,admin', 'lostReason' => 'sometimes|nullable|string']);
        if ($r->has('stage') && ! in_array($r->input('stage'), Crm::STAGES, true)) {
            throw new ApiError('UNKNOWN_STAGE');
        }
        $s = $this->crm->subject($r->input('id'));
        $crm = $this->crm->mutate($s, function (&$data) use ($r, $admin, $s) {
            if ($r->has('stage')) {
                $data['stage'] = $r->input('stage');
                $data['stageSetBy'] = $admin->username;
                $data['stageSetAt'] = now()->toISOString();
                $data['lostReason'] = $data['stage'] === 'lost' ? mb_substr(trim($r->input('lostReason') ?? ''), 0, 300) : null;
                if ($s instanceof User) {
                    $this->accounts->activity($s, 'crm.stage', ['stage' => $data['stage'], 'by' => $admin->username]);
                }
            }
            if ($r->has('owner')) {
                $data['owner'] = mb_substr(trim($r->input('owner') ?? ''), 0, 60) ?: null;
            }
            if ($r->has('source')) {
                if ($r->input('source') === null) {
                    unset($data['source']);
                } else {
                    $data['source'] = $r->input('source');
                }
            }
            if ($r->has('tags')) {
                $data['tags'] = array_slice(array_values(array_unique(array_filter(array_map(fn ($v) => mb_substr(trim($v), 0, 30), $r->input('tags'))))), 0, 12);
            }

            return $data;
        });

        return response()->json(['success' => true, 'crm' => $crm]);
    }

    public function updateLead(Request $r)
    {
        $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string', 'remove' => 'sometimes|boolean', 'company' => 'sometimes|nullable|string',
            'contactName' => 'sometimes|nullable|string', 'phone' => 'sometimes|nullable|string', 'email' => 'sometimes|nullable|string', 'note' => 'sometimes|nullable|string']);
        $id = $r->input('id');
        $lead = str_starts_with($id, 'lead:') ? Lead::find(substr($id, 5)) : null;
        if (! $lead) {
            throw new ApiError('NO_SUCH_LEAD', 404);
        }
        if ($r->boolean('remove')) {
            DB::transaction(function () use ($lead, $id) {
                DB::table('api_crm_records')->where('subject_id', $id)->delete();
                $lead->delete();
            });

            return response()->json(['success' => true]);
        }
        foreach (['company' => ['company', 120], 'contactName' => ['contact_name', 120], 'phone' => ['phone', 40], 'email' => ['email', 200], 'note' => ['note', 500]] as $key => [$column, $limit]) {
            if ($r->has($key)) {
                $lead->$column = mb_substr(trim($r->input($key) ?? ''), 0, $limit);
            }
        }
        if ($r->has('email')) {
            $lead->setAttribute('capture_key', $lead->email !== '' ? hash('sha256', mb_strtolower($lead->email)) : null);
        }
        $lead->save();

        return response()->json(['success' => true, 'lead' => $lead]);
    }

    public function note(Request $r)
    {
        $admin = $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string', 'text' => 'sometimes|nullable|string', 'noteId' => 'sometimes|string', 'kind' => 'sometimes|string', 'remove' => 'sometimes|boolean']);
        $s = $this->crm->subject($r->input('id'));
        $result = $this->crm->mutate($s, function (&$data) use ($r, $admin) {
            if ($r->boolean('remove')) {
                $index = array_search($r->input('noteId'), array_column($data['notes'], 'id'), true);
                if ($index === false) {
                    throw new ApiError('NO_SUCH_NOTE', 404);
                }
                array_splice($data['notes'], $index, 1);

                return ['success' => true, 'notes' => $data['notes']];
            }
            $text = mb_substr(trim($r->input('text') ?? ''), 0, 4000);
            if ($text === '') {
                throw new ApiError('EMPTY_NOTE');
            }
            $kind = in_array($r->input('kind'), ['note', 'call', 'email', 'meeting', 'decision']) ? $r->input('kind') : 'note';
            $note = ['id' => (string) Str::uuid(), 'at' => now()->toISOString(), 'by' => $admin->username, 'kind' => $kind, 'body' => $text];
            array_unshift($data['notes'], $note);

            return ['success' => true, 'note' => $note, 'notes' => $data['notes']];
        });

        return response()->json($result, $r->boolean('remove') ? 200 : 201);
    }

    public function task(Request $r)
    {
        $admin = $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string', 'title' => 'sometimes|nullable|string', 'taskId' => 'sometimes|string', 'done' => 'sometimes|boolean', 'remove' => 'sometimes|boolean', 'dueAt' => 'sometimes|nullable|string']);
        $s = $this->crm->subject($r->input('id'));
        $result = $this->crm->mutate($s, function (&$data) use ($r, $admin) {
            if ($r->has('taskId') || $r->boolean('remove') || $r->has('done')) {
                $index = array_search($r->input('taskId'), array_column($data['tasks'], 'id'), true);
                if ($index === false) {
                    throw new ApiError('NO_SUCH_TASK', 404);
                }
                if ($r->boolean('remove')) {
                    array_splice($data['tasks'], $index, 1);

                    return ['success' => true, 'tasks' => $data['tasks']];
                }
                $data['tasks'][$index]['doneAt'] = $r->boolean('done') ? now()->toISOString() : null;
                $data['tasks'][$index]['doneBy'] = $r->boolean('done') ? $admin->username : null;

                return ['success' => true, 'task' => $data['tasks'][$index], 'tasks' => $data['tasks']];
            }
            $title = mb_substr(trim($r->input('title') ?? ''), 0, 200);
            if ($title === '') {
                throw new ApiError('EMPTY_TASK');
            }
            try {
                $due = $r->filled('dueAt') ? Carbon::parse($r->input('dueAt'), 'UTC')->utc()->toISOString() : null;
            } catch (\Throwable) {
                throw new ApiError('INVALID_DUE_DATE');
            }
            $task = ['id' => (string) Str::uuid(), 'at' => now()->toISOString(), 'by' => $admin->username, 'title' => $title, 'dueAt' => $due, 'doneAt' => null, 'doneBy' => null];
            array_unshift($data['tasks'], $task);

            return ['success' => true, 'task' => $task, 'tasks' => $data['tasks']];
        });

        return response()->json($result, $r->has('taskId') || $r->boolean('remove') || $r->has('done') ? 200 : 201);
    }

    public function contacts(Request $r)
    {
        $this->accounts->requireUser($r, true);
        $r->validate(['page' => 'sometimes|integer|min:1', 'pageSize' => 'sometimes|integer|min:1|max:200', 'q' => 'sometimes|nullable|string',
            'sort' => 'sometimes|in:recent,oldest,engagement,value,expiring,stale,company', 'format' => 'sometimes|in:csv']);
        $contacts = array_values(array_filter($this->crm->contacts(), function ($c) use ($r) {
            foreach (['stage', 'lifecycle', 'source', 'owner', 'kind'] as $key) {
                if ($r->filled($key) && $c[$key] !== $r->input($key)) {
                    return false;
                }
            }
            if ($r->filled('tag') && ! in_array($r->input('tag'), $c['tags'], true)) {
                return false;
            }
            $q = mb_strtolower(trim($r->input('q') ?? ''));
            if ($q !== '' && ! str_contains(mb_strtolower(implode(' ', [$c['company'], $c['username'], $c['email'], $c['contactName'], $c['profile']['projectName'] ?? '', implode(' ', $c['tags'])])), $q)) {
                return false;
            }
            if ($r->filled('minEngagement') && $c['engagement']['score'] < $r->integer('minEngagement')) {
                return false;
            }
            if ($r->has('hasOpenTask') && ($c['openTasks'] > 0) !== $r->boolean('hasOpenTask')) {
                return false;
            }
            if ($r->has('overdue') && ($c['overdueTasks'] > 0) !== $r->boolean('overdue')) {
                return false;
            }

            return true;
        }));
        usort($contacts, fn ($a, $b) => (match ($r->input('sort', 'recent')) {
            'oldest' => strcmp($a['createdAt'], $b['createdAt']), 'engagement' => $b['engagement']['score'] <=> $a['engagement']['score'],
            'value' => ($b['monthlyValueHuf'] ?? -1) <=> ($a['monthlyValueHuf'] ?? -1), 'expiring' => ($a['subscription']['validUntil'] ?? '9999') <=> ($b['subscription']['validUntil'] ?? '9999'),
            'stale' => ($b['engagement']['daysSinceActive'] ?? PHP_INT_MAX) <=> ($a['engagement']['daysSinceActive'] ?? PHP_INT_MAX),
            'company' => strcasecmp($a['company'] ?? '', $b['company'] ?? ''), default => strcmp($b['createdAt'], $a['createdAt']),
        }) ?: strcmp($a['id'], $b['id']));
        if ($r->input('format') === 'csv') {
            return $this->csv($contacts);
        }
        $page = $r->integer('page', 1);
        $size = $r->integer('pageSize', 25);
        $facets = [];
        foreach (['stage', 'lifecycle', 'source', 'owner'] as $key) {
            $facets[$key] = (object) collect($contacts)->countBy($key)->all();
        }

        return response()->json(['total' => count($contacts), 'page' => $page, 'pageSize' => $size, 'contacts' => array_slice($contacts, ($page - 1) * $size, $size),
            'facets' => $facets, 'owners' => array_values(array_unique(array_filter(array_column($contacts, 'owner')))),
            'tags' => array_values(array_unique(array_merge([], ...array_column($contacts, 'tags')))), 'vocabulary' => $this->crm->vocabulary()]);
    }

    private function csv(array $contacts)
    {
        return response()->streamDownload(function () use ($contacts) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['kind', 'company', 'contact', 'email', 'phone', 'lifecycle', 'stage', 'owner', 'source', 'tags', 'created_at', 'last_login_at', 'plan', 'subscription_active', 'valid_until', 'days_left', 'monthly_value_huf', 'engagement', 'days_since_active', 'days_in_stage', 'open_tasks', 'notes', 'employees', 'county', 'investment_value_huf', 'readiness'], ',', '"', '', "\r\n");
            foreach ($contacts as $c) {
                $values = [$c['kind'], $c['company'], $c['contactName'] ?? $c['username'], $c['email'], $c['phone'], $c['lifecycle'], $c['stage'], $c['owner'], $c['source'], implode(', ', $c['tags']), $c['createdAt'], $c['lastLoginAt'], $c['subscription']['plan'], $c['subscription']['active'] ? 'true' : 'false', $c['subscription']['validUntil'], $c['subscription']['daysLeft'], $c['monthlyValueHuf'], $c['engagement']['score'], $c['engagement']['daysSinceActive'], $c['daysInStage'], $c['openTasks'], $c['notes'], $c['profile']['employees'] ?? null, $c['profile']['county'] ?? null, $c['profile']['investment_value'] ?? null, $c['readiness']];
                $values = array_map(fn ($v) => is_string($v) && preg_match('/^[\s]*[=+@\-]/u', $v) ? "'".$v : $v, $values);
                fputcsv($out, $values, ',', '"', '', "\r\n");
            }
            fclose($out);
        }, 'hunter-crm-contacts.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
