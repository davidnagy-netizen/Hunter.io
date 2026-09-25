<?php

use App\Services\CompanyMetrics;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Preserve uncertain legacy values; missing canonical fields require user completion. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->timestamp('email_verified_at')->nullable();
            $t->boolean('verification_required')->default(false);
        });
        Schema::table('company_profiles', function (Blueprint $t) {
            $t->renameColumn('revenue_band', 'legacy_revenue_band');
            $t->renameColumn('teaor_code', 'legacy_teaor_code');
        });
        Schema::table('company_profiles', function (Blueprint $t) {
            $t->string('legacy_revenue_band', 100)->nullable()->change();
            $t->string('legacy_teaor_code', 10)->nullable()->change();
        });
        Schema::table('company_profiles', function (Blueprint $t) {
            $t->enum('legal_form', CompanyMetrics::LEGAL_FORMS)->nullable();
            $t->unsignedInteger('headcount')->nullable();
            $t->unsignedTinyInteger('revenue_band')->nullable();
            $t->decimal('exact_revenue', 15, 2)->nullable();
            $t->string('teaor_code', 4)->nullable();
            $t->string('county_code', 2)->nullable();
            $t->text('nav_identity')->nullable();
            $t->string('tax_base_hash', 64)->nullable()->index();
            $t->boolean('metrics_complete')->default(false);
        });
        DB::table('company_profiles')->update(['headcount' => DB::raw('employees')]);
        foreach (CompanyMetrics::COUNTIES as $code => $name) {
            DB::table('company_profiles')->where('county', $name)->update(['county_code' => (string) $code]);
        }
        Schema::create('signup_sessions', function (Blueprint $t) {
            $t->string('token_hash', 64)->primary();
            $t->string('nonce_hash', 64)->nullable();
            $t->timestamp('expires_at')->index();
        });
        Schema::create('account_consents', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('document_version');
            $t->boolean('terms');
            $t->boolean('privacy');
            $t->boolean('marketing');
            $t->timestamp('accepted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_consents');
        Schema::dropIfExists('signup_sessions');
        Schema::table('company_profiles', fn (Blueprint $t) => $t->dropColumn(['legal_form', 'headcount', 'revenue_band', 'exact_revenue', 'teaor_code', 'county_code', 'nav_identity', 'tax_base_hash', 'metrics_complete']));
        Schema::table('company_profiles', function (Blueprint $t) {
            $t->renameColumn('legacy_revenue_band', 'revenue_band');
            $t->renameColumn('legacy_teaor_code', 'teaor_code');
        });
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['email_verified_at', 'verification_required']));
    }
};
