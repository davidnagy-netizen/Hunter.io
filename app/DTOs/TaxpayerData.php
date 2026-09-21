<?php

declare(strict_types=1);

namespace App\DTOs;

/**
 * Data Transfer Object (DTO) representing official taxpayer details from NAV Online Invoice API.
 *
 * Reference: CR-03 Section 4.3 - Official NAV Integration (`queryTaxpayer`).
 *
 * This immutable DTO standardizes taxpayer metadata retrieved on-demand from the National Tax and
 * Customs Administration of Hungary (NAV). It prevents raw XML/JSON vendor coupling across the application.
 */
readonly class TaxpayerData
{
    /**
     * @param  string  $taxNumber  Full 11-digit formatted tax number (xxxxxxxx-y-zz) or 8-digit base code.
     * @param  string  $companyName  Official registered legal name of the enterprise.
     * @param  string|null  $shortName  Abbreviated trading or commercial company name.
     * @param  string|null  $vatCode  VAT status code (middle single digit 'y').
     * @param  string|null  $countyCode  County code of registered seat (last two digits 'zz').
     * @param  string|null  $postalCode  Registered headquarters postal code.
     * @param  string|null  $city  Registered headquarters city name.
     * @param  string|null  $streetAddress  Registered headquarters street, building, and door details.
     * @param  string  $status  Taxpayer status code (e.g. 'VALID', 'SUSPENDED', 'DELETED').
     * @param  string|null  $incorporationDate  Date of registration / incorporation if provided.
     */
    public function __construct(
        public string $taxNumber,
        public string $companyName,
        public ?string $shortName = null,
        public ?string $vatCode = null,
        public ?string $countyCode = null,
        public ?string $postalCode = null,
        public ?string $city = null,
        public ?string $streetAddress = null,
        public string $status = 'VALID',
        public ?string $incorporationDate = null,
    ) {}

    /**
     * Compose a single human-readable full address string for UI confirmation.
     *
     * @return string Formatted registered address.
     */
    public function getFormattedAddress(): string
    {
        $parts = array_filter([
            $this->postalCode,
            $this->city,
            $this->streetAddress,
        ]);

        return empty($parts) ? 'Magyarország' : implode(' ', $parts);
    }

    /**
     * Serialize the DTO to an associative array for JSON API serialization.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'taxNumber' => $this->taxNumber,
            'companyName' => $this->companyName,
            'shortName' => $this->shortName ?? $this->companyName,
            'vatCode' => $this->vatCode,
            'countyCode' => $this->countyCode,
            'postalCode' => $this->postalCode,
            'city' => $this->city,
            'streetAddress' => $this->streetAddress,
            'fullAddress' => $this->getFormattedAddress(),
            'status' => $this->status,
            'incorporationDate' => $this->incorporationDate,
        ];
    }
}
