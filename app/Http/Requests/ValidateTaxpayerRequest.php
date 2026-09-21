<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest: Validate Hungarian Tax Number (Adószám) and Check-Digit (CDV).
 *
 * Reference: CR-03 Section 4.3 - Hungarian Check-Digit Validation (CDV) Algorithm.
 *
 * Hungarian Tax Number Format:
 * - Full format: 11 characters `xxxxxxxx-y-zz` or 11 digits `xxxxxxxxyzz`
 *   - `xxxxxxxx`: 8-digit base enterprise registration number (adótörzsszám)
 *   - `y`: 1-digit VAT code (1 = tax-exempt, 2 = standard VAT, 3 = EVA/KATA/group VAT)
 *   - `zz`: 2-digit territorial county code where company seat is officially registered
 *
 * Check-Digit Algorithm (CDV):
 * - Weights applied to the first 7 digits: [9, 7, 3, 1, 9, 7, 3]
 * - Sum = (digit_1 * 9) + (digit_2 * 7) + (digit_3 * 3) + (digit_4 * 1) + (digit_5 * 9) + (digit_6 * 7) + (digit_7 * 3)
 * - The 8th digit MUST match the least significant digit of the sum: (Sum % 10).
 */
class ValidateTaxpayerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool True as this is an on-demand public verification endpoint.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'tax_number' => [
                'required',
                'string',
                'regex:/^(\d{8}|\d{8}-\d-\d{2}|\d{11})$/',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_string($value) || ! self::validateCdvChecksum($value)) {
                        $fail(__('Érvénytelen adószám vagy CDV ellenőrző összeg hiba (Hungarian Tax Check-Digit Mismatch).'));
                    }
                },
            ],
        ];
    }

    /**
     * Extract the clean 8-digit base tax number (adótörzsszám) from the input.
     *
     * @return string 8-digit base tax number.
     */
    public function getCleanBaseTaxNumber(): string
    {
        $raw = (string) $this->input('tax_number');
        $digitsOnly = preg_replace('/\D/', '', $raw) ?? '';

        return substr($digitsOnly, 0, 8);
    }

    /**
     * Extract the full 11-digit clean tax number if present, otherwise returns the 8-digit base.
     *
     * @return string Normalized digits-only tax number.
     */
    public function getCleanTaxNumber(): string
    {
        $raw = (string) $this->input('tax_number');

        return preg_replace('/\D/', '', $raw) ?? '';
    }

    /**
     * Validate the Hungarian statutory CDV check-digit for an 8-digit base tax number.
     *
     * Educational Step-by-Step for Junior Developers:
     * 1. Remove all non-numeric formatting characters (e.g. hyphens).
     * 2. Ensure we have at least 8 digits to inspect.
     * 3. Multiply the first 7 digits by their respective statutory weights: 9, 7, 3, 1, 9, 7, 3.
     * 4. Sum the products.
     * 5. The check-digit is the remainder modulo 10 (least significant decimal digit).
     * 6. Compare computed check-digit against the 8th digit of the input.
     *
     * @param  string  $taxNumber  Full or 8-digit tax number.
     * @return bool True if the CDV checksum passes.
     */
    public static function validateCdvChecksum(string $taxNumber): bool
    {
        // Step 1: Strip formatting hyphens and whitespace
        $digits = preg_replace('/\D/', '', $taxNumber);

        // Step 2: Must have at least 8 numeric digits
        if (! is_string($digits) || strlen($digits) < 8) {
            return false;
        }

        // Step 3: Define statutory Hungarian tax weights
        $weights = [9, 7, 3, 1, 9, 7, 3];
        $sum = 0;

        for ($i = 0; $i < 7; $i++) {
            $digit = (int) $digits[$i];
            $sum += $digit * $weights[$i];
        }

        // Step 4: The 8th digit is the calculated CDV check digit
        $expectedCheckDigit = $sum % 10;
        $actualCheckDigit = (int) $digits[7];

        // Step 5: Verification check
        return $expectedCheckDigit === $actualCheckDigit;
    }

    /**
     * Custom validation error messages for localized user feedback.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tax_number.required' => __('Az adószám megadása kötelező.'),
            'tax_number.regex' => __('Kérjük, érvényes 8 vagy 11 jegyű magyar adószámot adjon meg (pl. 12345678 vagy 12345678-1-42).'),
        ];
    }
}
