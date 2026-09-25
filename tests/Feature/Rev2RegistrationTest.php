<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\VerifyAccountEmail;
use App\Services\CompanyMetrics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\Support\RegistersVerifiedCompany;
use Tests\TestCase;

/** End-to-end registration invariants: identity, consent, atomicity and owner privacy. */
class Rev2RegistrationTest extends TestCase
{
    use RefreshDatabase, RegistersVerifiedCompany;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_signup_ignores_client_identity_and_requires_email_verification(): void
    {
        $payload = $this->signupPayload();
        $payload['company'] = 'Forged company';
        $payload['metrics']['exact_revenue'] = '200000000.00';
        $payload['metrics']['revenue_band'] = 1;
        $response = $this->postJson('/api/auth/register', $payload)->assertCreated()->assertJsonPath('user.emailVerified', false);
        $user = User::first();
        Notification::assertSentTo($user, VerifyAccountEmail::class);
        $this->assertSame('Teszt & Társ Kft.', $user->companyProfile->nav_identity['company_name']);
        $this->assertSame(3, $user->companyProfile->revenue_band);
        $this->assertDatabaseHas('account_consents', ['terms' => true, 'privacy' => true, 'marketing' => false]);
        $this->withUnencryptedCookie('fundor_session', $response->getCookie('fundor_session', false)->getValue());
        $this->getJson('/api/catalog')->assertForbidden()->assertJsonPath('code', 'EMAIL_VERIFICATION_REQUIRED');
        $this->postJson('/api/auth/verification/resend')->assertOk();
        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->get($url)->assertRedirect('/app');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->getJson('/api/catalog')->assertOk();
    }

    public function test_each_required_consent_is_enforced_without_consuming_receipt(): void
    {
        $payload = $this->signupPayload();
        foreach (['accept_terms', 'accept_privacy'] as $field) {
            $this->postJson('/api/auth/register', array_replace($payload, [$field => false]))->assertStatus(400);
            $this->assertDatabaseCount('users', 0);
        }
        $this->postJson('/api/auth/register', $payload)->assertCreated();
    }

    public function test_tampered_expired_and_replayed_receipts_are_rejected(): void
    {
        $payload = $this->signupPayload();
        $this->postJson('/api/auth/register', array_replace($payload, ['verification_receipt' => 'tampered']))->assertStatus(422);
        $this->postJson('/api/auth/register', $payload)->assertCreated();
        $this->postJson('/api/auth/register', array_replace($payload, ['email' => 'another@example.com']))->assertStatus(422);
        $this->assertDatabaseCount('users', 1);
        $this->travel(31)->minutes();
        $this->postJson('/api/auth/register', $payload)->assertStatus(422);
    }

    public function test_receipt_is_bound_to_browser_session(): void
    {
        $payload = $this->signupPayload();
        $this->withUnencryptedCookie('fundor_signup', str_repeat('a', 64));
        $this->postJson('/api/auth/register', $payload)->assertStatus(422);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_transaction_rolls_back_nonce_consumption_on_duplicate_email(): void
    {
        $payload = $this->signupPayload();
        User::create(['name' => 'Existing', 'username' => 'existing', 'email' => $payload['email'], 'password' => 'test-password']);
        $this->postJson('/api/auth/register', $payload)->assertStatus(409);
        $payload['email'] = 'new@example.com';
        $this->postJson('/api/auth/register', $payload)->assertCreated();
    }

    public function test_export_and_erasure_are_owner_scoped_and_revoke_sessions(): void
    {
        $response = $this->postJson('/api/auth/register', $this->signupPayload())->assertCreated();
        $user = User::first();
        $other = User::create(['name' => 'Other', 'username' => 'other', 'email' => 'other@example.com', 'password' => 'test-password']);
        $this->withUnencryptedCookie('fundor_session', $response->getCookie('fundor_session', false)->getValue());
        $this->getJson('/api/v1/account/export')->assertOk()->assertJsonPath('account.email', 'alice@example.com')
            ->assertJsonPath('official_identity.tax_number', '12345676-2-42');
        $this->deleteJson('/api/v1/account', ['password' => 'wrong'])->assertForbidden();
        Cache::put('nav-owner:'.$user->id, 'encrypted', 3600);
        $this->deleteJson('/api/v1/account', ['password' => 'correct-horse-battery'])->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseHas('users', ['id' => $other->id]);
        $this->assertDatabaseCount('account_consents', 0);
        $this->assertDatabaseCount('company_profiles', 0);
        $this->assertDatabaseCount('api_sessions', 0);
        $this->assertNull(Cache::get('nav-owner:'.$user->id));
    }

    public function test_metrics_validate_catalog_membership_and_decimal_boundaries(): void
    {
        foreach (['49999999.99' => 1, '50000000' => 2, '200000000' => 3, '800000000' => 4, '4000000000' => 5, '20000000000' => 5, '20000000000.01' => 6] as $amount => $band) {
            $this->assertSame($band, CompanyMetrics::band((string) $amount));
        }
        $payload = $this->signupPayload();
        $payload['metrics']['teaor_code'] = '6201';
        $this->postJson('/api/auth/register', $payload)->assertStatus(400);
        $this->getJson('/api/v1/sectors/search?query=programoz')->assertOk()->assertJsonPath('data.0.code', '6210');
        $this->assertDatabaseCount('users', 0);
    }
}
