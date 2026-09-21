<?php

declare(strict_types=1);

use App\Enums\InstrumentType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Add Instrument Type and Provenance Dates to Opportunities Table.
 *
 * Reference: CR-02 Section 4.2 - Kavosz / Széchenyi Card Loan Handling & Data Model Separation.
 *
 * Requirements:
 * 1. Differentiate non-repayable grants from debt instruments via `instrument_type` enum string.
 * 2. Mandatory data provenance tracking: `effective_from_date`, `source_document_reference`, and `last_verified_date`.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            // Financial instrument classification: grant, subsidised_loan, guarantee, combined
            $table->string('instrument_type', 32)
                ->default(InstrumentType::GRANT->value)
                ->after('status')
                ->index();

            // Legal provenance tracking
            $table->date('effective_from_date')->nullable()->after('instrument_type');
            $table->string('source_document_reference', 255)->nullable()->after('effective_from_date');
            $table->date('last_verified_date')->nullable()->after('source_document_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropIndex(['instrument_type']);
            $table->dropColumn([
                'instrument_type',
                'effective_from_date',
                'source_document_reference',
                'last_verified_date',
            ]);
        });
    }
};
