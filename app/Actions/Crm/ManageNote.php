<?php

namespace App\Actions\Crm;

use Illuminate\Support\Fluent;
use App\Models\User;
use App\Services\Crm;
use App\Exceptions\ApiError;
use Illuminate\Support\Str;

class ManageNote
{
    public function __construct(private Crm $crm) {}

    public function execute(array $data, User $admin): array
    {
        $input = new Fluent($data);
        $s = $this->crm->subject($input->get('id'));
        $result = $this->crm->mutate($s, function (&$data) use ($input, $admin) {
            if ($input->boolean('remove')) {
                $index = array_search($input->get('noteId'), array_column($data['notes'], 'id'), true);
                if ($index === false) {
                    throw new ApiError('NO_SUCH_NOTE', 404);
                }
                array_splice($data['notes'], $index, 1);

                return ['success' => true, 'notes' => $data['notes']];
            }
            $text = mb_substr(trim($input->get('text') ?? ''), 0, 4000);
            if ($text === '') {
                throw new ApiError('EMPTY_NOTE');
            }
            $kind = in_array($input->get('kind'), ['note', 'call', 'email', 'meeting', 'decision']) ? $input->get('kind') : 'note';
            $note = ['id' => (string) Str::uuid(), 'at' => now()->toISOString(), 'by' => $admin->username, 'kind' => $kind, 'body' => $text];
            array_unshift($data['notes'], $note);

            return ['success' => true, 'note' => $note, 'notes' => $data['notes']];
        });

        return $result;
    }
}
