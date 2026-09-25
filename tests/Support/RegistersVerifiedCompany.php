<?php

namespace Tests\Support;

use App\Services\Profiles;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

/** Shared real XML fixture and receipt flow, without bypassing registration validation. */
trait RegistersVerifiedCompany
{
    protected function configureNav(): void
    {
        config(['nav.login' => 'technical', 'nav.password' => 'test-secret', 'nav.tax_number' => '12345676',
            'nav.signature_key' => 'sign-key', 'nav.software_id' => 'HU12345676FUNDOR001',
            'nav.developer_name' => 'Fundor', 'nav.developer_contact' => 'developer@fundor.hu']);
        Http::preventStrayRequests();
    }

    protected function navXml(): string
    {
        return file_get_contents(base_path('tests/Fixtures/nav/taxpayer.xml'));
    }

    protected function signupPayload(string $email = 'alice@example.com'): array
    {
        $this->configureNav();
        Notification::fake();
        Http::fake(['*queryTaxpayer' => Http::response($this->navXml(), 200, ['Content-Type' => 'application/xml'])]);
        $lookup = $this->postJson('/api/v1/taxpayer/lookup', ['tax_number' => '12345676'])->assertOk();
        $this->withCredentials()->withUnencryptedCookie('fundor_signup', $lookup->getCookie('fundor_signup', false)->getValue());

        return ['name' => 'Test Contact', 'email' => $email, 'password' => 'correct-horse-battery', 'password_confirmation' => 'correct-horse-battery',
            'verification_receipt' => $lookup->json('verification_receipt'), 'accept_terms' => true, 'accept_privacy' => true,
            'marketing_opt_in' => false, 'metrics' => app(Profiles::class)->demo()];
    }
}
