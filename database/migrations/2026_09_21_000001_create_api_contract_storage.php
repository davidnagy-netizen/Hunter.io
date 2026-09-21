<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->string('email')->nullable()->change());
        Schema::table('company_profiles', fn (Blueprint $t) => $t->json('api_extra')->nullable());
        Schema::table('opportunities', fn (Blueprint $t) => $t->json('api_extra')->nullable());
        Schema::table('leads', function (Blueprint $t) {
            $t->json('api_extra')->nullable();
            $t->string('capture_key')->nullable()->unique();
        });
        Schema::create('api_sessions', function (Blueprint $t) {
            $t->string('token_hash', 64)->primary();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->timestamp('expires_at')->index();
        });
        Schema::create('api_account_states', function (Blueprint $t) {
            $t->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $t->json('answers');
            $t->json('saved');
            $t->json('versions');
            $t->json('activity');
            $t->json('subscriptions');
        });
        Schema::create('api_crm_records', function (Blueprint $t) {
            $t->string('subject_id')->primary();
            $t->json('data');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_crm_records');
        Schema::dropIfExists('api_account_states');
        Schema::dropIfExists('api_sessions');
        Schema::table('leads', function (Blueprint $t) {
            $t->dropUnique(['capture_key']);
            $t->dropColumn(['api_extra', 'capture_key']);
        });
        Schema::table('opportunities', fn (Blueprint $t) => $t->dropColumn('api_extra'));
        Schema::table('company_profiles', fn (Blueprint $t) => $t->dropColumn('api_extra'));
        // Keep email nullable: API accounts may have registered without an email.
    }
};
