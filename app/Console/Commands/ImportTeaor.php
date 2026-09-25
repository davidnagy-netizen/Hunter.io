<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Integrations\KSH\TeaorClient;

/** Import public KSH classification workbooks, never company registry records. */
class ImportTeaor extends Command
{
    protected $signature = 'fundor:import-teaor';

    protected $description = 'Import the official TEÁOR 2025 structure and 2008 conversion map';

    public function handle(TeaorClient $client): int
    {
        $output = $client->fetch();
        if (count($output['sectors']) < 500 || count($output['mapping']) < 500) {
            $this->error('Unexpected KSH workbook structure; existing data was not replaced.');

            return self::FAILURE;
        }
        foreach ($output['mapping'] as &$codes) {
            $codes = array_values(array_unique($codes));
        }
        unset($codes);
        $output['imported_at'] = now()->toIso8601String();
        file_put_contents(resource_path('data/teaor25.json'), json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n");
        $this->info(count($output['sectors']).' sectors imported.');

        return self::SUCCESS;
    }

}
