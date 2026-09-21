<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Feature Test: NAV Taxpayer Lookup API Endpoint (`POST /api/nav/taxpayer`).
 *
 * Reference: CR-03 Section 4.3 - Official NAV Integration & Anti-Bulk Harvesting.
 */
class NavTaxpayerLookupTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    /**
     * Test successful taxpayer lookup with valid CDV tax number.
     */
    public function test_taxpayer_lookup_succeeds_with_valid_tax_number(): void
    {
        $response = $this->postJson('/api/nav/taxpayer', [
            'tax_number' => '12345674-2-42',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'taxpayer' => [
                    'taxNumber',
                    'companyName',
                    'shortName',
                    'fullAddress',
                    'status',
                ],
            ]);
    }

    /**
     * Test taxpayer lookup fails validation when CDV checksum is incorrect.
     */
    public function test_taxpayer_lookup_fails_validation_on_invalid_cdv(): void
    {
        $response = $this->postJson('/api/nav/taxpayer', [
            'tax_number' => '12345675-2-42', // Invalid CDV check-digit
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('code', 'INVALID_REQUEST')
            ->assertJsonStructure(['fields' => ['tax_number']]);
    }

    /**
     * Test taxpayer lookup integrates seamlessly with Http::fake() mocking.
     */
    public function test_taxpayer_lookup_with_http_fake(): void
    {
        config(['services.nav.base_url' => 'https://api.nav.gov.hu/mock']);

        Http::fake([
            'https://api.nav.gov.hu/mock/queryTaxpayer*' => Http::response([
                'taxpayerName' => 'Teszt Vállalkozás Kft.',
                'taxpayerShortName' => 'Teszt Kft.',
                'taxpayerValidity' => 'VALID',
                'taxpayerAddress' => [
                    'postalCode' => '1117',
                    'city' => 'Budapest',
                    'streetName' => 'Alíz utca 2.',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/nav/taxpayer', [
            'tax_number' => '10000009',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('taxpayer.companyName', 'Teszt Vállalkozás Kft.')
            ->assertJsonPath('taxpayer.city', 'Budapest');
    }
}
