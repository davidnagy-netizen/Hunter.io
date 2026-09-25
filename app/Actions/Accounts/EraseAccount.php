<?php

namespace App\Actions\Accounts;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class EraseAccount
{
    public function execute(User $u): void
    {
        DB::transaction(function () use ($u) {
            foreach ($u->leads as $lead) {
                DB::table('api_crm_records')->where('subject_id', 'lead:'.$lead->id)->delete();
                $lead->delete();
            }
            DB::table('api_crm_records')->where('subject_id', (string) $u->id)->delete();
            DB::table('sessions')->where('user_id', $u->id)->delete();
            DB::table('password_reset_tokens')->where('email', $u->email)->delete();
            $u->delete();
        });
        Cache::forget('nav-owner:'.$u->id);

    }
}
