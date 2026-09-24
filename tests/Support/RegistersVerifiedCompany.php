<?php

namespace Tests\Support;

use App\Services\Api\Profiles;
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
        return '<QueryTaxpayerResponse xmlns="http://schemas.nav.gov.hu/OSA/3.0/api" xmlns:c="http://schemas.nav.gov.hu/NTCA/1.0/common" xmlns:b="http://schemas.nav.gov.hu/OSA/3.0/base">
            <c:result><c:funcCode>OK</c:funcCode></c:result><taxpayerValidity>true</taxpayerValidity>
            <taxpayerData><taxpayerName>Teszt &amp; Társ Kft.</taxpayerName><taxpayerShortName>Teszt Kft.</taxpayerShortName>
            <taxNumberDetail><b:taxpayerId>12345676</b:taxpayerId><b:vatCode>2</b:vatCode><b:countyCode>42</b:countyCode></taxNumberDetail>
            <incorporation>ORGANIZATION</incorporation><vatGroupMembership>10000001</vatGroupMembership>
            <taxpayerAddressList><taxpayerAddressItem><taxpayerAddressType>HQ</taxpayerAddressType><taxpayerAddress>
            <b:countryCode>HU</b:countryCode><b:postalCode>1117</b:postalCode><b:city>Budapest</b:city><b:streetName>Alíz</b:streetName><b:publicPlaceCategory>utca</b:publicPlaceCategory><b:number>2.</b:number>
            </taxpayerAddress></taxpayerAddressItem></taxpayerAddressList></taxpayerData></QueryTaxpayerResponse>';
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
