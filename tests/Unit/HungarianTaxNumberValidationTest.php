<?php

namespace Tests\Unit;

use App\Rules\HungarianTaxNumberRule;
use PHPUnit\Framework\TestCase;

/** Official complement algorithm, including independently calculated zero-check-digit cases. */
class HungarianTaxNumberValidationTest extends TestCase
{
    public function test_valid_vectors(): void
    {
        // Weighted sum 144 => complement 6; sum 9 => complement 1; sum 10 => 0.
        foreach (['12345676', '12345676-2-42', '12345676242', '10000001', '10010000'] as $value) {
            $this->assertTrue(HungarianTaxNumberRule::valid($value), $value);
        }
    }

    public function test_invalid_shapes_and_checksums(): void
    {
        foreach (['12345674', '12345675', '1234567', '12345676a', '', '１２３４５６７６', '12345676-22-42', '12345676-2'] as $value) {
            $this->assertFalse(HungarianTaxNumberRule::valid($value), $value);
        }
    }
}
