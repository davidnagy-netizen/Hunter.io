<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Sector\TeaorClassificationService;
use Tests\TestCase;

/**
 * Unit Test: TEÁOR'25 Classification and Act XXXIV of 2004 Revenue Banding.
 *
 * Reference: CR-03 Section 4.3 - Sector Classification & Statutory SME Revenue Bands.
 */
class TeaorClassificationTest extends TestCase
{
    private TeaorClassificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TeaorClassificationService;
    }

    /**
     * Test mapping of legacy TEÁOR'08 codes to modern TEÁOR'25.
     */
    public function test_teaor_classification_mapping(): void
    {
        $this->assertEquals('6201', $this->service->resolveTeaor08To25('62.01'));
        $this->assertEquals('2562', $this->service->resolveTeaor08To25('2562'));
    }

    /**
     * Test revenue band calculation matching the 6 statutory SME bands.
     */
    public function test_statutory_revenue_band_calculation(): void
    {
        // Band 1: Under 50M HUF (Micro)
        $this->assertEquals(1, $this->service->calculateRevenueBand(35_000_000));

        // Band 2: 50M – 200M HUF (Micro)
        $this->assertEquals(2, $this->service->calculateRevenueBand(120_000_000));

        // Band 3: 200M – 800M HUF (Micro/Small)
        $this->assertEquals(3, $this->service->calculateRevenueBand(500_000_000));

        // Band 4: 800M – 4,000M HUF (Small)
        $this->assertEquals(4, $this->service->calculateRevenueBand(1_500_000_000));

        // Band 5: 4,000M – 20,000M HUF (Medium)
        $this->assertEquals(5, $this->service->calculateRevenueBand(10_000_000_000));

        // Band 6: Over 20,000M HUF (Large — non-SME)
        $this->assertEquals(6, $this->service->calculateRevenueBand(25_000_000_000));
    }

    /**
     * Test CR-03 requirement: if program defines a threshold that falls strictly within
     * a band without exact revenue provided, engine returns INSUFFICIENT_DATA.
     */
    public function test_revenue_threshold_returns_insufficient_data_when_exact_revenue_absent(): void
    {
        // Program requires at least 150M HUF revenue.
        // Company reports Band 2 (50M - 200M).
        // Without exact revenue, it's impossible to know if they are above 150M => INSUFFICIENT_DATA
        $verdict = $this->service->evaluateRevenueThreshold(
            revenueBand: 2,
            exactRevenue: null,
            requiredMinHuf: 150_000_000
        );

        $this->assertEquals('INSUFFICIENT_DATA', $verdict);

        // When exact revenue is supplied (160M >= 150M), it resolves deterministically to ELIGIBLE
        $exactVerdict = $this->service->evaluateRevenueThreshold(
            revenueBand: 2,
            exactRevenue: 160_000_000,
            requiredMinHuf: 150_000_000
        );

        $this->assertEquals('ELIGIBLE', $exactVerdict);
    }
}
