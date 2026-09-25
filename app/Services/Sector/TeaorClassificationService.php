<?php

declare(strict_types=1);

namespace App\Services\Sector;

use App\Services\CompanyMetrics;

/** Compatibility facade. Fundor revenue bands do not establish statutory SME status. */
class TeaorClassificationService
{
    /** Resolve only unambiguous KSH conversions; never assume identity mappings. */
    public function resolveTeaor08To25(string $legacyCode): ?string
    {
        $codes = app(TeaorService::class)->fromLegacy(str_replace('.', '', $legacyCode));

        return count($codes) === 1 ? $codes[0] : null;
    }

    public function calculateRevenueBand(float|int $exactRevenue): int
    {
        return CompanyMetrics::band(number_format($exactRevenue, 2, '.', ''));
    }

    /** CR-03: a precise program threshold requires exact reported revenue. */
    public function evaluateRevenueThreshold(int $revenueBand, ?float $exactRevenue, float $requiredMinHuf): string
    {
        if ($exactRevenue === null) {
            return 'INSUFFICIENT_DATA';
        }

        return $exactRevenue >= $requiredMinHuf ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
    }
}
