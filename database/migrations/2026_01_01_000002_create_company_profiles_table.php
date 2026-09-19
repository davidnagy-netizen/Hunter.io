<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('company_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('company_name');
            $table->string('initials', 10)->nullable();
            $table->integer('employees')->default(0);
            $table->string('region_code', 10);
            $table->string('county', 100);
            $table->string('industry_id', 50);
            $table->string('teaor_code', 10);
            $table->string('revenue_band', 100);
            $table->integer('closed_business_years')->default(0);
            $table->json('goals');
            $table->decimal('planned_investment_value', 15, 2)->default(0);
            $table->string('project_name')->nullable();
            $table->json('funding_preferences')->nullable();
            $table->boolean('de_minimis_ok')->nullable();
            $table->boolean('consortium_ready')->nullable();
            $table->boolean('eu_experience')->nullable();
            $table->string('country', 10)->default('HU');
            $table->string('org_type', 50)->default('sme');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_profiles');
    }
};
