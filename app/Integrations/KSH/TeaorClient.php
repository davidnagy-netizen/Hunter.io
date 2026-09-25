<?php

declare(strict_types=1);

namespace App\Integrations\KSH;

use Illuminate\Support\Facades\Http;
use ZipArchive;

class TeaorClient
{
    public function fetch(): array
    {
        $sources = [
            'structure' => 'https://www.ksh.hu/docs/osztalyozasok/teaor/teaor25_struktura.xlsx',
            'mapping' => 'https://www.ksh.hu/docs/osztalyozasok/teaor/teaor08-teaor25-4szj.xlsx',
        ];
        $output = ['sources' => [], 'sectors' => [], 'mapping' => []];
        foreach ($sources as $kind => $url) {
            $body = Http::connectTimeout(10)->timeout(60)->get($url)->throw()->body();
            $output['sources'][$kind] = ['url' => $url, 'sha256' => hash('sha256', $body)];
            $rows = $this->rows($body);
            foreach ($rows as $row) {
                $row['A'] = str_replace('.', '', $row['A'] ?? '');
                $row['C'] = str_replace('.', '', $row['C'] ?? '');
                if ($kind === 'structure' && preg_match('/^[0-9]{4}$/D', $row['A'] ?? '') && isset($row['B'])) {
                    $output['sectors'][$row['A']] = $row['B'];
                }
                if ($kind === 'mapping' && preg_match('/^[0-9]{4}$/D', $row['A'] ?? '') && preg_match('/^[0-9]{4}$/D', $row['C'] ?? '')) {
                    $output['mapping'][$row['A']][] = $row['C'];
                }
            }
        }

        return $output;
    }

    /** Read only KSH worksheet cells; preserve leading zeros in activity codes. */
    private function rows(string $body): array
    {
        $file = tempnam(sys_get_temp_dir(), 'fundor-ksh-');
        file_put_contents($file, $body);
        $zip = new ZipArchive;
        try {
            if ($zip->open($file) !== true) {
                throw new \RuntimeException('Invalid KSH workbook');
            }
            $shared = simplexml_load_string($zip->getFromName('xl/sharedStrings.xml'), options: LIBXML_NONET);
            $strings = [];
            foreach ($shared->si as $item) {
                $strings[] = implode('', array_map('strval', $item->xpath('.//*[local-name()="t"]')));
            }
            $sheet = simplexml_load_string($zip->getFromName('xl/worksheets/sheet1.xml'), options: LIBXML_NONET);
            $rows = [];
            foreach ($sheet->sheetData->row as $row) {
                $cells = [];
                foreach ($row->c as $cell) {
                    $column = preg_replace('/[0-9]/', '', (string) $cell['r']);
                    $value = (string) $cell->v;
                    $cells[$column] = (string) $cell['t'] === 's' ? $strings[(int) $value] : $value;
                }
                $rows[] = $cells;
            }

            return $rows;
        } finally {
            $zip->close();
            unlink($file);
        }
    }
}
