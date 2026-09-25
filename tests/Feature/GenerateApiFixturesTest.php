<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GenerateApiFixturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_generation_is_isolated_from_the_application_database_and_live_http(): void
    {
        $user = User::factory()->create();
        $connection = config('database.default');
        $http = Http::getFacadeRoot();
        $directory = sys_get_temp_dir().'/fundor-fixtures-'.bin2hex(random_bytes(8));
        try {
            $this->artisan('fundor:generate-api-fixtures', ['--output' => $directory])->assertSuccessful();
            $this->assertSame($connection, config('database.default'));
            $this->assertSame($http, Http::getFacadeRoot());
            $this->assertSame(1, User::count());
            $this->assertNotNull($user->fresh());
            $catalog = json_decode(File::get($directory.'/catalog.subscriber.hu.json'), true, flags: JSON_THROW_ON_ERROR);
            $this->assertFalse($catalog['gated']);
            $this->assertCount(12, $catalog['opportunities']);
            $lookup = json_decode(File::get($directory.'/nav.taxpayer.json'), true, flags: JSON_THROW_ON_ERROR);
            $this->assertSame('12345676-2-42', $lookup['data']['tax_number']);
            $this->assertFileExists($directory.'/detail.consortium.answered.hu.json');
        } finally {
            File::deleteDirectory($directory);
        }
    }
}
