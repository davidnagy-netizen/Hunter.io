<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * An account can keep several company profiles (two free, more after an admin unlocks them) and works on one at a time.
 * Saved calls, eligibility answers and profile history move from the account to each company.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->unsignedBigInteger('active_profile_id')->nullable();
            $t->unsignedTinyInteger('profile_limit')->default(2);
        });
        Schema::table('company_profiles', function (Blueprint $t) {
            $t->json('answers')->nullable();
            $t->json('saved')->nullable();
            $t->json('versions')->nullable();
        });
        // Every existing account keeps working on its one company, which takes over the company-specific state.
        foreach (DB::table('company_profiles')->orderBy('id')->get(['id', 'user_id']) as $profile) {
            if (! DB::table('users')->where('id', $profile->user_id)->whereNull('active_profile_id')->update(['active_profile_id' => $profile->id])) {
                continue;
            }
            $state = DB::table('api_account_states')->where('user_id', $profile->user_id)->first();
            if ($state) {
                DB::table('company_profiles')->where('id', $profile->id)->update(['answers' => $state->answers, 'saved' => $state->saved, 'versions' => $state->versions]);
                DB::table('api_account_states')->where('user_id', $profile->user_id)->update(['answers' => '[]', 'saved' => '[]', 'versions' => '[]']);
            }
        }
    }

    public function down(): void
    {
        foreach (DB::table('users')->whereNotNull('active_profile_id')->get(['id', 'active_profile_id']) as $user) {
            $profile = DB::table('company_profiles')->where('id', $user->active_profile_id)->first();
            if ($profile && $profile->versions !== null) {
                DB::table('api_account_states')->where('user_id', $user->id)->update(['answers' => $profile->answers ?? '[]', 'saved' => $profile->saved ?? '[]', 'versions' => $profile->versions]);
            }
        }
        Schema::table('company_profiles', fn (Blueprint $t) => $t->dropColumn(['answers', 'saved', 'versions']));
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['active_profile_id', 'profile_limit']));
    }
};
