<?php

namespace App\Actions\Crm;

use Illuminate\Support\Fluent;
use App\Models\User;
use App\Services\Crm;
use App\Exceptions\ApiError;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class ManageTask
{
    public function __construct(private Crm $crm) {}

    public function execute(array $data, User $admin): array
    {
        $input = new Fluent($data);
        $s = $this->crm->subject($input->get('id'));
        $result = $this->crm->mutate($s, function (&$data) use ($input, $admin) {
            if ($input->has('taskId') || $input->boolean('remove') || $input->has('done')) {
                $index = array_search($input->get('taskId'), array_column($data['tasks'], 'id'), true);
                if ($index === false) {
                    throw new ApiError('NO_SUCH_TASK', 404);
                }
                if ($input->boolean('remove')) {
                    array_splice($data['tasks'], $index, 1);

                    return ['success' => true, 'tasks' => $data['tasks']];
                }
                $data['tasks'][$index]['doneAt'] = $input->boolean('done') ? now()->toISOString() : null;
                $data['tasks'][$index]['doneBy'] = $input->boolean('done') ? $admin->username : null;

                return ['success' => true, 'task' => $data['tasks'][$index], 'tasks' => $data['tasks']];
            }
            $title = mb_substr(trim($input->get('title') ?? ''), 0, 200);
            if ($title === '') {
                throw new ApiError('EMPTY_TASK');
            }
            try {
                $due = $input->filled('dueAt') ? Carbon::parse($input->get('dueAt'), 'UTC')->utc()->toISOString() : null;
            } catch (\Throwable) {
                throw new ApiError('INVALID_DUE_DATE');
            }
            $task = ['id' => (string) Str::uuid(), 'at' => now()->toISOString(), 'by' => $admin->username, 'title' => $title, 'dueAt' => $due, 'doneAt' => null, 'doneBy' => null];
            array_unshift($data['tasks'], $task);

            return ['success' => true, 'task' => $task, 'tasks' => $data['tasks']];
        });

        return $result;
    }
}
