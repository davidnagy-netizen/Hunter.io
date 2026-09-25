<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Integrations\NAV\NavClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\Support\RegistersVerifiedCompany;
use Tests\TestCase;

/** CR-03 integration tests exercise XML, transport errors and cache ownership. */
class NavTaxpayerLookupTest extends TestCase
{
    use RefreshDatabase, RegistersVerifiedCompany;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->configureNav();
    }

    public function test_valid_lookup_uses_signed_xml_and_normalizes_official_fields(): void
    {
        Http::fake(['*' => Http::response($this->navXml())]);
        $response = $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676-2-42'])->assertOk();
        $response->assertJsonPath('data.company_name', 'Teszt & Társ Kft.')
            ->assertJsonPath('data.registered_seat_address.house_number', '2.')
            ->assertJsonPath('data.vat_group_membership.is_member', true);
        Http::assertSent(fn ($r) => $r->method() === 'POST'
            && str_contains($r->body(), 'SHA3-512') && str_contains($r->body(), '<taxNumber>12345676</taxNumber>'));
        $this->assertDatabaseCount('company_profiles', 0);
        $this->assertDatabaseCount('signup_sessions', 1);
    }

    public function test_checksum_and_shape_fail_before_network(): void
    {
        Http::fake();
        foreach (['12345674', '12345676xyz', '1234567', '12345676-22-42'] as $number) {
            $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => $number])->assertStatus(400);
        }
        Http::assertNothingSent();
    }

    public function test_missing_configuration_does_not_fabricate_identity(): void
    {
        config(['nav.login' => null]);
        Http::fake();
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertStatus(503)->assertJsonPath('code', 'NAV_UNAVAILABLE');
        Http::assertNothingSent();
    }

    public function test_unregistered_taxpayer_is_not_retried(): void
    {
        Http::fake(['*' => Http::response(str_replace('<taxpayerValidity>true', '<taxpayerValidity>false', $this->navXml()))]);
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertNotFound();
        Http::assertSentCount(1);
    }

    public function test_transient_errors_retry_but_malformed_xml_is_rejected(): void
    {
        Http::fake(['*' => Http::sequence()->push('', 503)->push('', 429)->push('<broken>')]);
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertStatus(502);
        Http::assertSentCount(3);
    }

    public function test_timeout_returns_unavailable_after_three_attempts(): void
    {
        Http::fake(fn () => throw new ConnectionException('timeout'));
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertStatus(503);
    }

    public function test_signature_uses_utc_timestamp_and_xml_escapes_metadata(): void
    {
        config(['nav.developer_name' => 'A & B']);
        $xml = app(NavClient::class)->requestXml('12345676', 'request123', '2026-09-24T01:02:03.456Z');
        $this->assertStringContainsString(strtoupper(hash('sha3-512', 'request12320260924010203sign-key')), $xml);
        $this->assertStringContainsString('A &amp; B', $xml);
        $this->assertStringContainsString(strtoupper(hash('sha512', 'test-secret')), $xml);
    }

    public function test_session_throttle_and_no_anonymous_identity_cache(): void
    {
        Http::fake(['*' => Http::response($this->navXml())]);
        $first = $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertOk();
        $this->withCredentials()->withUnencryptedCookie('fundor_signup', $first->getCookie('fundor_signup', false)->getValue());
        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertOk();
        }
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertStatus(429);
        Http::assertSentCount(5);
    }

    public function test_receipt_registration_and_account_cache_are_owner_scoped(): void
    {
        $payload = $this->signupPayload();
        $response = $this->postJson('/api/auth/register', $payload)->assertCreated();
        $u = User::first();
        $u->markEmailAsVerified();
        $this->withUnencryptedCookie('fundor_session', $response->getCookie('fundor_session', false)->getValue());
        Http::fake(['*' => Http::response($this->navXml())]);
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertOk();
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertOk();
        Http::assertSentCount(1);
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '10000001'])->assertForbidden();
        $this->travel(25)->hours();
        // Account sessions remain valid for the configured duration; renew for the TTL assertion.
        DB::table('api_sessions')->update(['expires_at' => now()->addHour()]);
        $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertOk();
        Http::assertSentCount(2);
    }
}
