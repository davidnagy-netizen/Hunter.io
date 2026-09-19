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
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('program');
            $table->string('title');
            $table->json('goals')->nullable();
            $table->decimal('funding_min', 15, 2)->default(0);
            $table->decimal('funding_max', 15, 2)->default(0);
            $table->float('intensity')->default(0.5);
            $table->date('deadline');
            $table->string('source_reference');
            $table->string('source_url')->nullable();
            $table->boolean('curated')->default(false);
            $table->boolean('is_new')->default(false);
            $table->boolean('high_admin')->default(false);
            $table->json('docs')->nullable();
            $table->json('hard_rules')->nullable();
            $table->json('soft_rules')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};
