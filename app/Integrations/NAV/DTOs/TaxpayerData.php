<?php

declare(strict_types=1);

namespace App\Integrations\NAV\DTOs;

/** Immutable official identity. Missing vendor fields remain unknown. */
final readonly class TaxpayerData
{
    /** @param array<string, string|null>|null $registeredSeatAddress */
    public function __construct(
        public string $taxNumber,
        public string $companyName,
        public ?string $shortName,
        public ?string $vatGroupId,
        public ?array $registeredSeatAddress,
        public string $incorporation,
    ) {}

    /** @return array<string, mixed> Versioned API representation. */
    public function toArray(): array
    {
        return [
            'tax_number' => $this->taxNumber,
            'company_name' => $this->companyName,
            'short_name' => $this->shortName,
            'vat_group_membership' => ['is_member' => $this->vatGroupId !== null, 'group_id' => $this->vatGroupId],
            'registered_seat_address' => $this->registeredSeatAddress,
            'incorporation' => $this->incorporation,
        ];
    }

    /** Legacy adapter composes display fields without inventing official facts. */
    public function legacy(): array
    {
        $a = $this->registeredSeatAddress ?? [];
        $street = implode(' ', array_filter([$a['street'] ?? null, $a['public_place_category'] ?? null, $a['house_number'] ?? null]));

        return [
            'taxNumber' => $this->taxNumber, 'companyName' => $this->companyName,
            'shortName' => $this->shortName ?? $this->companyName,
            'postalCode' => $a['postal_code'] ?? null, 'city' => $a['city'] ?? null,
            'streetAddress' => $street ?: null,
            'fullAddress' => implode(' ', array_filter([$a['postal_code'] ?? null, $a['city'] ?? null, $street])),
            'status' => 'VALID', 'incorporationDate' => null,
        ];
    }
}
