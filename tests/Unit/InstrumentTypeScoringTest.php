<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Enums\InstrumentType;
use App\Services\Scoring;
use Tests\TestCase;

/**
 * Unit Test: Financial Instrument Types & Scoring Pipeline Segregation.
 *
 * Reference: CR-02 Section 4.2 - Kavosz / Széchenyi Card Loan Handling & Scoring Separation.
 *
 * Requirements:
 * 1. Differentiate grants from debt instruments via InstrumentType enum.
 * 2. Verify that loan models with `instrument_type = subsidised_loan` cannot pass
 *    through grant-only score calculation pipelines.
 */
class InstrumentTypeScoringTest extends TestCase
{
    /**
     * Test InstrumentType enum classifications.
     */
    public function test_instrument_type_enum_classifications(): void
    {
        $this->assertTrue(InstrumentType::GRANT->isGrant());
        $this->assertFalse(InstrumentType::GRANT->isDebtInstrument());

        $this->assertTrue(InstrumentType::SUBSIDISED_LOAN->isDebtInstrument());
        $this->assertFalse(InstrumentType::SUBSIDISED_LOAN->isGrant());

        $this->assertTrue(InstrumentType::GUARANTEE->isDebtInstrument());
        $this->assertFalse(InstrumentType::COMBINED->isGrant());
        $this->assertTrue(InstrumentType::COMBINED->isDebtInstrument());
    }

    /**
     * Test that subsidised loan instruments are rejected by grant scoring calculation pipelines.
     */
    public function test_subsidised_loans_cannot_pass_through_grant_scoring_pipeline(): void
    {
        $scoring = app(Scoring::class);

        $opportunityData = [
            'id' => 'kavosz-szechenyi-kartya-1',
            'instrument_type' => InstrumentType::SUBSIDISED_LOAN->value,
            'title' => 'Széchenyi Kártya Folyószámlahitel MAX+',
            'intensity' => 0.03, // interest rate subsidy
            'funding_min' => 1000000,
            'funding_max' => 100000000,
            'deadline' => '2026-12-31',
            'hard' => [],
            'highAdmin' => false,
            'awardsFunding' => false,
        ];

        $companyProfile = [
            'employees' => 20,
            'county' => 'Pest',
        ];

        // The scoring engine MUST throw InvalidArgumentException when evaluating debt instruments
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Subsidised loans and debt instruments cannot be evaluated using grant award scoring algorithms (CR-02).');

        $scoring->score($opportunityData, $companyProfile);
    }
}
