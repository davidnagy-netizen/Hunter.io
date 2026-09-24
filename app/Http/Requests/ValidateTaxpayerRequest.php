<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\HungarianTaxNumberRule;

/** Compatibility entry point; CDV has a single authoritative implementation. */
class ValidateTaxpayerRequest extends TaxpayerLookupRequest
{
    public static function validateCdvChecksum(string $value): bool
    {
        return HungarianTaxNumberRule::valid($value);
    }

    public function getCleanTaxNumber(): string
    {
        return str_replace('-', '', (string) $this->input('tax_number'));
    }

    public function getCleanBaseTaxNumber(): string
    {
        return substr($this->getCleanTaxNumber(), 0, 8);
    }
}
