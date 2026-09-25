<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enumeration of financial instrument types supported by the Fundor platform.
 *
 * Reference: CR-02 Section 4.2 - Kavosz / Széchenyi Card Loan Handling & Data Model Separation.
 *
 * Important Domain Rules:
 * 1. Non-repayable grants (GRANT) provide direct non-repayable capital injections.
 * 2. Loans, guarantees and combined products contain debt obligations.
 *    They evaluate interest rate subsidies and cost of capital saved, rather than treating
 *    the gross principal as direct funding awards.
 * 3. Never rank or evaluate loan products using grant-based award scoring algorithms.
 */
enum InstrumentType: string
{
    case GRANT = 'grant';
    case SUBSIDISED_LOAN = 'subsidised_loan';
    case GUARANTEE = 'guarantee';
    case COMBINED = 'combined';

    /**
     * Determines whether the instrument is eligible for the grant-only pipeline.
     *
     * @return bool True only for a standalone grant.
     */
    public function isGrant(): bool
    {
        return $this === self::GRANT;
    }

    /**
     * Determines whether the instrument represents a debt obligation subject to credit intermediation regulations.
     *
     * @return bool True for loans, guarantees and combined instruments.
     */
    public function isDebtInstrument(): bool
    {
        return $this !== self::GRANT;
    }

    /**
     * Returns a human-readable Hungarian label for UI display.
     *
     * @return string Hungarian label.
     */
    public function labelHu(): string
    {
        return match ($this) {
            self::GRANT => 'Vissza nem térítendő támogatás',
            self::SUBSIDISED_LOAN => 'Támogatott hitelkonstrukció',
            self::GUARANTEE => 'Garancia / Kezességvállalás',
            self::COMBINED => 'Kombinált (hitel + támogatás)',
        };
    }

    /**
     * Returns a human-readable English label for UI display.
     *
     * @return string English label.
     */
    public function labelEn(): string
    {
        return match ($this) {
            self::GRANT => 'Non-repayable Grant',
            self::SUBSIDISED_LOAN => 'Subsidised Loan Facility',
            self::GUARANTEE => 'Guarantee Instrument',
            self::COMBINED => 'Combined Loan & Grant',
        };
    }
}
