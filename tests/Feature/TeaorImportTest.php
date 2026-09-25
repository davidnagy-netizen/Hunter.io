<?php

namespace Tests\Feature;

use App\Integrations\KSH\TeaorClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use ZipArchive;

class TeaorImportTest extends TestCase
{
    public function test_ksh_workbooks_preserve_leading_zeroes_and_small_imports_do_not_replace_data(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'fundor-workbook-');
        try {
            $zip = new ZipArchive;
            $zip->open($file, ZipArchive::OVERWRITE);
            $zip->addFromString('xl/sharedStrings.xml', '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>01.11</t></si><si><t>Growing crops</t></si><si><t>01.12</t></si></sst>');
            $zip->addFromString('xl/worksheets/sheet1.xml', '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row></sheetData></worksheet>');
            $zip->close();
            Http::preventStrayRequests();
            Http::fake(['www.ksh.hu/*' => Http::response(file_get_contents($file))]);
            $data = app(TeaorClient::class)->fetch();
            $this->assertSame(['0111' => 'Growing crops'], $data['sectors']);
            $this->assertSame(['0111' => ['0112']], $data['mapping']);
            $before = hash_file('sha256', resource_path('data/teaor25.json'));
            $this->artisan('fundor:import-teaor')->assertFailed();
            $this->assertSame($before, hash_file('sha256', resource_path('data/teaor25.json')));
        } finally {
            unlink($file);
        }
    }
}
