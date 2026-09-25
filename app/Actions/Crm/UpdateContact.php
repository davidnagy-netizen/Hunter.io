<?php

namespace App\Actions\Crm;

use Illuminate\Support\Fluent;
use App\Models\User;
use App\Services\Accounts;
use App\Services\Crm;
use App\Exceptions\ApiError;
use Illuminate\Support\Str;

class UpdateContact
{
    public function __construct(private Accounts $accounts, private Crm $crm) {}

    public function execute(array $data, User $admin): array
    {
        $input = new Fluent($data);
        if ($input->has('stage') && ! in_array($input->get('stage'), Crm::STAGES, true)) {
            throw new ApiError('UNKNOWN_STAGE');
        }
        $s = $this->crm->subject($input->get('id'));
        $crm = $this->crm->mutate($s, function (&$data) use ($input, $admin, $s) {
            if ($input->has('stage')) {
                $data['stage'] = $input->get('stage');
                $data['stageSetBy'] = $admin->username;
                $data['stageSetAt'] = now()->toISOString();
                $data['lostReason'] = $data['stage'] === 'lost' ? mb_substr(trim($input->get('lostReason') ?? ''), 0, 300) : null;
                if ($s instanceof User) {
                    $this->accounts->activity($s, 'crm.stage', ['stage' => $data['stage'], 'by' => $admin->username]);
                }
            }
            if ($input->has('owner')) {
                $data['owner'] = mb_substr(trim($input->get('owner') ?? ''), 0, 60) ?: null;
            }
            if ($input->has('source')) {
                if ($input->get('source') === null) {
                    unset($data['source']);
                } else {
                    $data['source'] = $input->get('source');
                }
            }
            if ($input->has('tags')) {
                $data['tags'] = array_slice(array_values(array_unique(array_filter(array_map(fn ($v) => mb_substr(trim($v), 0, 30), $input->get('tags'))))), 0, 12);
            }

            return $data;
        });

        return ['success' => true, 'crm' => $crm];
    }
}
