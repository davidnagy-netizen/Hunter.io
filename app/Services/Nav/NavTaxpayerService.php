<?php

declare(strict_types=1);

namespace App\Services\Nav;

use App\DTOs\TaxpayerData;
use App\Rules\HungarianTaxNumberRule;
use App\Services\Api\ApiError;
use DOMDocument;
use DOMXPath;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/** CR-03: on-demand NAV v3 XML exchange. No fabricated fallback or shared identity cache. */
class NavTaxpayerService
{
    /** Query a valid identifier. @throws ApiError when NAV cannot verify the identity. */
    public function queryTaxpayer(string $taxNumber): TaxpayerData
    {
        if (! HungarianTaxNumberRule::valid($taxNumber)) {
            throw new ApiError('INVALID_REQUEST');
        }
        $base = substr(str_replace('-', '', $taxNumber), 0, 8);
        foreach (['login', 'password', 'tax_number', 'signature_key', 'software_id', 'developer_name', 'developer_contact'] as $key) {
            if (! config("nav.$key")) {
                throw new ApiError('NAV_UNAVAILABLE', 503);
            }
        }
        $url = rtrim((string) config('nav.base_url'), '/');
        if (! in_array($url, ['https://api-test.onlineszamla.nav.gov.hu/invoiceService/v3', 'https://api.onlineszamla.nav.gov.hu/invoiceService/v3'], true)) {
            throw new ApiError('NAV_UNAVAILABLE', 503);
        }
        for ($attempt = 0; $attempt < 3; $attempt++) {
            if ($attempt > 0) {
                usleep(250_000 * (2 ** ($attempt - 1)));
            }
            try {
                $response = Http::connectTimeout(3)->timeout(10)->withoutRedirecting()
                    ->withBody($this->requestXml($base, 'F'.Str::upper(Str::random(29)), now('UTC')->format('Y-m-d\\TH:i:s.v\\Z')), 'application/xml')
                    ->accept('application/xml')->post($url.'/queryTaxpayer');
            } catch (ConnectionException) {
                continue;
            }
            if ($response->status() === 429 || $response->serverError()) {
                continue;
            }
            if (! $response->successful()) {
                throw new ApiError('NAV_UNAVAILABLE', 503);
            }

            return $this->parse($response->body(), $base);
        }
        throw new ApiError('NAV_UNAVAILABLE', 503);
    }

    /** Deterministic builder supports independent authentication-vector testing. */
    public function requestXml(string $base, string $requestId, string $timestamp): string
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $api = 'http://schemas.nav.gov.hu/OSA/3.0/api';
        $common = 'http://schemas.nav.gov.hu/NTCA/1.0/common';
        $root = $document->appendChild($document->createElementNS($api, 'QueryTaxpayerRequest'));
        $append = function ($parent, string $name, string $value, string $namespace) use ($document) {
            $element = $document->createElementNS($namespace, $name);
            $element->appendChild($document->createTextNode($value));
            $parent->appendChild($element);

            return $element;
        };
        $header = $append($root, 'common:header', '', $common);
        foreach (['requestId' => $requestId, 'timestamp' => $timestamp, 'requestVersion' => '3.0', 'headerVersion' => '1.0'] as $key => $value) {
            $append($header, 'common:'.$key, $value, $common);
        }
        $user = $append($root, 'common:user', '', $common);
        $append($user, 'common:login', (string) config('nav.login'), $common);
        $append($user, 'common:passwordHash', strtoupper(hash('sha512', (string) config('nav.password'))), $common)->setAttribute('cryptoType', 'SHA-512');
        $append($user, 'common:taxNumber', (string) config('nav.tax_number'), $common);
        // NAV signs ID + UTC timestamp (digits through seconds) + technical signature key.
        $stamp = substr(preg_replace('/[^0-9]/', '', $timestamp), 0, 14);
        $signature = strtoupper(hash('sha3-512', $requestId.$stamp.config('nav.signature_key')));
        $append($user, 'common:requestSignature', $signature, $common)->setAttribute('cryptoType', 'SHA3-512');
        $software = $append($root, 'software', '', $api);
        foreach (['softwareId' => config('nav.software_id'), 'softwareName' => 'Fundor', 'softwareOperation' => 'ONLINE_SERVICE', 'softwareMainVersion' => '1.0', 'softwareDevName' => config('nav.developer_name'), 'softwareDevContact' => config('nav.developer_contact')] as $key => $value) {
            $append($software, $key, (string) $value, $api);
        }
        $append($root, 'taxNumber', $base, $api);

        return $document->saveXML();
    }

    /** Map headquarters only; branches are not the registered seat. */
    private function parse(string $xml, string $base): TaxpayerData
    {
        if (strlen($xml) > 1_000_000 || stripos($xml, '<!DOCTYPE') !== false || stripos($xml, '<!ENTITY') !== false) {
            throw new ApiError('NAV_INVALID_RESPONSE', 502);
        }
        $doc = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        try {
            if (! $doc->loadXML($xml, LIBXML_NONET)) {
                throw new ApiError('NAV_INVALID_RESPONSE', 502);
            }
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
        $xpath = new DOMXPath($doc);
        $xpath->registerNamespace('a', 'http://schemas.nav.gov.hu/OSA/3.0/api');
        $xpath->registerNamespace('c', 'http://schemas.nav.gov.hu/NTCA/1.0/common');
        $xpath->registerNamespace('b', 'http://schemas.nav.gov.hu/OSA/3.0/base');
        $get = fn (string $path): ?string => ($v = trim($xpath->evaluate('string('.$path.')'))) !== '' ? $v : null;
        if ($get('/a:QueryTaxpayerResponse/c:result/c:funcCode') !== 'OK') {
            throw new ApiError('NAV_UNAVAILABLE', 503);
        }
        $valid = $get('/a:QueryTaxpayerResponse/a:taxpayerValidity');
        if (in_array($valid, ['false', '0'], true)) {
            throw new ApiError('TAXPAYER_NOT_FOUND', 404);
        }
        $prefix = '/a:QueryTaxpayerResponse/a:taxpayerData';
        $name = $get($prefix.'/a:taxpayerName');
        $id = $get($prefix.'/a:taxNumberDetail/b:taxpayerId');
        $vat = $get($prefix.'/a:taxNumberDetail/b:vatCode');
        $county = $get($prefix.'/a:taxNumberDetail/b:countyCode');
        if (! in_array($valid, ['true', '1'], true) || ! $name || $id !== $base || ! preg_match('/^[0-9]$/D', $vat ?? '') || ! preg_match('/^[0-9]{2}$/D', $county ?? '')) {
            throw new ApiError('NAV_INVALID_RESPONSE', 502);
        }
        $path = $prefix.'/a:taxpayerAddressList/a:taxpayerAddressItem[a:taxpayerAddressType="HQ"]/a:taxpayerAddress';
        $address = null;
        if ($xpath->query($path)->length) {
            $address = [];
            foreach (['country_code' => 'countryCode', 'postal_code' => 'postalCode', 'city' => 'city', 'street' => 'streetName', 'public_place_category' => 'publicPlaceCategory', 'house_number' => 'number', 'county' => 'region', 'building' => 'building', 'staircase' => 'staircase', 'floor' => 'floor', 'door' => 'door'] as $key => $nav) {
                $address[$key] = $get($path.'/b:'.$nav);
            }
        }

        return new TaxpayerData("$id-$vat-$county", $name, $get($prefix.'/a:taxpayerShortName'), $get($prefix.'/a:vatGroupMembership'), $address, $get($prefix.'/a:incorporation') ?? 'UNKNOWN');
    }
}
