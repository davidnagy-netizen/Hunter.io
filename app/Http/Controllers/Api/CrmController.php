<?php

namespace App\Http\Controllers\Api;

use App\Models\Lead;
use App\Services\Accounts;
use App\Services\Crm;
use Illuminate\Http\Request;

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

    public function updateContact(Request $r, \App\Actions\Crm\UpdateContact $action)
    {
        $admin = $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string', 'stage' => 'sometimes|string', 'owner' => 'sometimes|nullable|string',
            'tags' => 'sometimes|array', 'tags.*' => 'string', 'source' => 'sometimes|nullable|in:assessment,signup,admin', 'lostReason' => 'sometimes|nullable|string']);
        $result = $action->execute($r->all(), $admin);

        return response()->json($result);
    }

    public function updateLead(Request $r, \App\Actions\Crm\UpdateLead $action)
    {
        $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string', 'remove' => 'sometimes|boolean', 'company' => 'sometimes|nullable|string',
            'contactName' => 'sometimes|nullable|string', 'phone' => 'sometimes|nullable|string', 'email' => 'sometimes|nullable|string', 'note' => 'sometimes|nullable|string']);
        $result = $action->execute($r->all());

        return response()->json($result);
    }

    public function note(Request $r, \App\Actions\Crm\ManageNote $action)
    {
        $admin = $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string', 'text' => 'sometimes|nullable|string', 'noteId' => 'sometimes|string', 'kind' => 'sometimes|string', 'remove' => 'sometimes|boolean']);
        $result = $action->execute($r->all(), $admin);

        return response()->json($result, $r->boolean('remove') ? 200 : 201);
    }

    public function task(Request $r, \App\Actions\Crm\ManageTask $action)
    {
        $admin = $this->accounts->requireUser($r, true);
        $r->validate(['id' => 'required|string', 'title' => 'sometimes|nullable|string', 'taskId' => 'sometimes|string', 'done' => 'sometimes|boolean', 'remove' => 'sometimes|boolean', 'dueAt' => 'sometimes|nullable|string']);
        $result = $action->execute($r->all(), $admin);

        return response()->json($result, $r->has('taskId') || $r->boolean('remove') || $r->has('done') ? 200 : 201);
    }

    public function contacts(Request $r, \App\Services\ContactSearch $search)
    {
        $this->accounts->requireUser($r, true);
        $r->validate(['page' => 'sometimes|integer|min:1', 'pageSize' => 'sometimes|integer|min:1|max:200', 'q' => 'sometimes|nullable|string',
            'sort' => 'sometimes|in:recent,oldest,engagement,value,expiring,stale,company', 'format' => 'sometimes|in:csv']);
        $contacts = $search->filter($this->crm->contacts(), $r->all());
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
        }, 'fundor-crm-contacts.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
