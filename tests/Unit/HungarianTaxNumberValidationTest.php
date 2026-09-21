<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Http\Requests\ValidateTaxpayerRequest;
use Tests\TestCase;

/**
 * Unit Test: Hungarian Tax Number (Adószám) CDV Check-Digit Validation.
 *
 * Reference: CR-03 Section 4.3 - Hungarian Check-Digit Validation (CDV) Algorithm.
 */
class HungarianTaxNumberValidationTest extends TestCase
{
    /**
     * Test valid 8-digit base tax numbers and 11-digit formatted tax numbers.
     */
    public function test_valid_hungarian_tax_numbers_pass_cdv_validation(): void
    {
        // 12345674: 1*9 + 2*7 + 3*3 + 4*1 + 5*9 + 6*7 + 7*3 = 144 => 144 % 10 = 4 (check digit matches)
        $this->assertTrue(ValidateTaxpayerRequest::validateCdvChecksum('12345674'));
        $this->assertTrue(ValidateTaxpayerRequest::validateCdvChecksum('12345674-2-42'));
        $this->assertTrue(ValidateTaxpayerRequest::validateCdvChecksum('12345674242'));

        // 10000009: 1*9 = 9 => 9 % 10 = 9
        $this->assertTrue(ValidateTaxpayerRequest::validateCdvChecksum('10000009'));
        $this->assertTrue(ValidateTaxpayerRequest::validateCdvChecksum('10000009-1-01'));
    }

    /**
     * Test invalid checksums and malformed inputs are correctly rejected.
     */
    public function test_invalid_hungarian_tax_numbers_fail_cdv_validation(): void
    {
        // Wrong check digit (12345675 instead of 12345674)
        $this->assertFalse(ValidateTaxpayerRequest::validateCdvChecksum('12345675'));
        $this->assertFalse(ValidateTaxpayerRequest::validateCdvChecksum('12345675-2-42'));

        // Too short
        $this->assertFalse(ValidateTaxpayerRequest::validateCdvChecksum('1234567'));
        $this->assertFalse(ValidateTaxpayerRequest::validateCdvChecksum(''));

        // Non-numeric
        $this->assertFalse(ValidateTaxpayerRequest::validateCdvChecksum('abcdefgh'));
    }
}
