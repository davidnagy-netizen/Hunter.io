<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Never fabricate provenance or silently reclassify existing funding records.
        if (DB::table('opportunities')->whereNull('instrument_type')->orWhere('instrument_type', '!=', 'grant')->exists()) {
            throw new RuntimeException('CR-02: existing non-grant records require a reviewed data migration before this migration can run.');
        }

        Schema::table('opportunities', function (Blueprint $table) {
            $table->string('manual_reviewed_by')->nullable();
            $table->text('loan_terms')->nullable();
        });

        $valid = "instrument_type IS NOT NULL AND instrument_type IN ('grant', 'subsidised_loan', 'guarantee', 'combined')
            AND (instrument_type = 'grant' OR (
                effective_from_date IS NOT NULL AND last_verified_date IS NOT NULL
                AND source_document_reference IS NOT NULL AND LENGTH(TRIM(source_document_reference)) > 0
                AND manual_reviewed_by IS NOT NULL AND LENGTH(TRIM(manual_reviewed_by)) > 0
                AND loan_terms IS NOT NULL AND LENGTH(TRIM(loan_terms)) > 0 AND curated = ".(DB::getDriverName() === 'pgsql' ? 'true' : '1').'))';

        if (DB::getDriverName() === 'sqlite') {
            // SQLite cannot add a CHECK to an existing table; enforce both write paths with triggers.
            $condition = preg_replace('/\b(instrument_type|effective_from_date|last_verified_date|source_document_reference|manual_reviewed_by|loan_terms|curated)\b/', 'NEW.$1', $valid);
            foreach (['INSERT', 'UPDATE'] as $event) {
                DB::unprepared("CREATE TRIGGER opportunities_cr02_{$event} BEFORE {$event} ON opportunities
                    WHEN NOT ({$condition}) BEGIN SELECT RAISE(ABORT, 'CR-02 instrument type or loan provenance invalid'); END");
            }
        } else {
            DB::statement("ALTER TABLE opportunities ADD CONSTRAINT opportunities_cr02 CHECK ({$valid})");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            foreach (['INSERT', 'UPDATE'] as $event) {
                DB::unprepared("DROP TRIGGER IF EXISTS opportunities_cr02_{$event}");
            }
        } else {
            $drop = DB::getDriverName() === 'mysql' ? 'DROP CHECK' : 'DROP CONSTRAINT';
            DB::statement("ALTER TABLE opportunities {$drop} opportunities_cr02");
        }
        Schema::table('opportunities', fn (Blueprint $table) => $table->dropColumn(['manual_reviewed_by', 'loan_terms']));
    }
};
