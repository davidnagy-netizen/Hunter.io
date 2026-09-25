<?php

namespace App\Console\Commands;

use App\Models\Opportunity;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ImportReviewedLoan extends Command
{
    protected $signature = 'fundor:import-reviewed-loan {file : Local JSON transcribed from official Business Rules} {--reviewed-by= : Reviewer name or internal identifier} {--confirm-manual-review : Attest that the official document was reviewed manually}';

    protected $description = 'Import one manually verified debt instrument without fetching any external data';

    public function handle(): int
    {
        $path = realpath($this->argument('file'));
        if (! $this->option('confirm-manual-review') || ! trim((string) $this->option('reviewed-by')) || ! $path || ! is_file($path)) {
            $this->error('Provide a local JSON file, --reviewed-by and --confirm-manual-review.');

            return self::FAILURE;
        }

        try {
            $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            $data = Validator::make(is_array($data) ? $data : [], [
                'code' => 'required|string|max:255',
                'instrument_type' => 'required|in:subsidised_loan,guarantee,combined',
                'title' => 'required|string|max:255',
                'program' => 'required|string|max:255',
                'deadline' => 'required|date_format:Y-m-d',
                'status' => 'required|in:open,forthcoming,closed',
                'effective_from_date' => 'required|date_format:Y-m-d',
                'last_verified_date' => 'required|date_format:Y-m-d|before_or_equal:today',
                'source_document_reference' => 'required|string|max:255',
                'loan_terms' => 'required|string|max:100000',
            ])->validate();
            $record = Opportunity::firstOrNew(['code' => $data['code']]);
            if ($record->exists && $record->isGrant()) {
                $this->error('The code belongs to a grant. Use a distinct loan code.');

                return self::FAILURE;
            }
            $record->fill($data + [
                'source_reference' => $data['source_document_reference'],
                'curated' => true,
                'manual_reviewed_by' => trim($this->option('reviewed-by')),
                // Loan terms carry principal/rates; grant fields must not represent loan benefits.
                'funding_min' => 0, 'funding_max' => 0, 'intensity' => 0,
            ])->save();
        } catch (\JsonException|ValidationException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }
        $this->info('Reviewed loan saved. Credit recommendations remain blocked pending the MNB legal opinion.');

        return self::SUCCESS;
    }
}
