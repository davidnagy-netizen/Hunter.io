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
 * 2. Subsidised loans (SUBSIDISED_LOAN) and guarantees (GUARANTEE) are debt instruments.
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
     * Determines whether the instrument awards direct non-repayable funding.
     *
     * @return bool True if the financial instrument provides non-repayable funds.
     */
    public function isGrant(): bool
    {
        return $this === self::GRANT || $this === self::COMBINED;
    }

    /**
     * Determines whether the instrument represents a debt obligation subject to credit intermediation regulations.
     *
     * @return bool True if the instrument is a loan or credit guarantee.
     */
    public function isDebtInstrument(): bool
    {
        return $this === self::SUBSIDISED_LOAN || $this === self::GUARANTEE;
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
