<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** CR-03: validate shape before applying the official Hungarian CDV complement. */
final class HungarianTaxNumberRule implements ValidationRule
{
    public static function valid(string $value): bool
    {
        if (! preg_match('/^(?:[0-9]{8}|[0-9]{11}|[0-9]{8}-[0-9]-[0-9]{2})$/D', $value)) {
            return false;
        }
        $digits = str_replace('-', '', $value);
        $sum = 0;
        foreach ([9, 7, 3, 1, 9, 7, 3] as $i => $weight) {
            $sum += (int) $digits[$i] * $weight;
        }

        // Complement to the next multiple of ten, including a zero check digit.
        return (10 - $sum % 10) % 10 === (int) $digits[7];
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! self::valid($value)) {
            $fail('Érvénytelen magyar adószám.');
        }
    }
}
