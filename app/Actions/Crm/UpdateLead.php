<?php

namespace App\Actions\Crm;

use Illuminate\Support\Fluent;
use App\Models\Lead;
use App\Exceptions\ApiError;
use Illuminate\Support\Facades\DB;

class UpdateLead
{
    public function execute(array $data): array
    {
        $input = new Fluent($data);
        $id = $input->get('id');
        $lead = str_starts_with($id, 'lead:') ? Lead::find(substr($id, 5)) : null;
        if (! $lead) {
            throw new ApiError('NO_SUCH_LEAD', 404);
        }
        if ($input->boolean('remove')) {
            DB::transaction(function () use ($lead, $id) {
                DB::table('api_crm_records')->where('subject_id', $id)->delete();
                $lead->delete();
            });

            return ['success' => true];
        }
        foreach (['company' => ['company', 120], 'contactName' => ['contact_name', 120], 'phone' => ['phone', 40], 'email' => ['email', 200], 'note' => ['note', 500]] as $key => [$column, $limit]) {
            if ($input->has($key)) {
                $lead->$column = mb_substr(trim($input->get($key) ?? ''), 0, $limit);
            }
        }
        if ($input->has('email')) {
            $lead->setAttribute('capture_key', $lead->email !== '' ? hash('sha256', mb_strtolower($lead->email)) : null);
        }
        $lead->save();

        return ['success' => true, 'lead' => $lead];
    }
}
