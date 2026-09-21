<?php

declare(strict_types=1);

namespace App\Services\Sector;

/**
 * Service Class: TEÁOR'25 Economic Classification & Hungarian SME Revenue Band Standards.
 *
 * Reference: CR-03 Section 4.3 - Sector Classification (TEÁOR'25) & Revenue Banding (Act XXXIV of 2004).
 *
 * Regulatory Rules:
 * 1. Store economic activities strictly as TEÁOR'25 4-digit numeric codes.
 * 2. Provide conversion mapping from historical TEÁOR'08 codes found in older EU/Hungarian funding tenders.
 * 3. Enforce the 6 statutory SME revenue bands:
 *    - Band 1: Under 50M HUF (Micro)
 *    - Band 2: 50M – 200M HUF (Micro)
 *    - Band 3: 200M – 800M HUF (Micro / Small boundary)
 *    - Band 4: 800M – 4,000M HUF (Small)
 *    - Band 5: 4,000M – 20,000M HUF (Medium)
 *    - Band 6: Over 20,000M HUF (Large — non-SME)
 * 4. If a grant call specifies a precise numeric threshold and only `revenue_band` is provided,
 *    the engine must return `INSUFFICIENT_DATA` rather than guessing.
 */
class TeaorClassificationService
{
    /**
     * Statutory Revenue Bands per Hungarian SME Act (Act XXXIV of 2004).
     */
    public const REVENUE_BANDS = [
        1 => [
            'id' => 1,
            'label_hu' => '50 millió Ft alatt (Mikrovállalkozás)',
            'label_en' => 'Under 50M HUF (Micro enterprise)',
            'min_huf' => 0,
            'max_huf' => 50_000_000,
            'sme_class' => 'micro',
        ],
        2 => [
            'id' => 2,
            'label_hu' => '50M – 200M Ft (Mikrovállalkozás)',
            'label_en' => '50M – 200M HUF (Micro enterprise)',
            'min_huf' => 50_000_000,
            'max_huf' => 200_000_000,
            'sme_class' => 'micro',
        ],
        3 => [
            'id' => 3,
            'label_hu' => '200M – 800M Ft (Mikro / Kisvállalkozási határ)',
            'label_en' => '200M – 800M HUF (Micro / Small boundary)',
            'min_huf' => 200_000_000,
            'max_huf' => 800_000_000,
            'sme_class' => 'small',
        ],
        4 => [
            'id' => 4,
            'label_hu' => '800M – 4,000M Ft (Kisvállalkozás)',
            'label_en' => '800M – 4,000M HUF (Small enterprise)',
            'min_huf' => 800_000_000,
            'max_huf' => 4_000_000_000,
            'sme_class' => 'small',
        ],
        5 => [
            'id' => 5,
            'label_hu' => '4,000M – 20,000M Ft (Középvállalkozás)',
            'label_en' => '4,000M – 20,000M HUF (Medium enterprise)',
            'min_huf' => 4_000_000_000,
            'max_huf' => 20_000_000_000,
            'sme_class' => 'medium',
        ],
        6 => [
            'id' => 6,
            'label_hu' => '20,000M Ft felett (Nagyvállalat — nem KKV)',
            'label_en' => 'Over 20,000M HUF (Large enterprise — non-SME)',
            'min_huf' => 20_000_000_000,
            'max_huf' => null,
            'sme_class' => 'large',
        ],
    ];

    /**
     * Common TEÁOR'25 high-level economic sectors for onboarding selection.
     */
    public const COMMON_TEAOR25_SECTORS = [
        '6201' => ['code' => '6201', 'name_hu' => 'Számítógépes programozás', 'name_en' => 'Computer programming activities'],
        '2562' => ['code' => '2562', 'name_hu' => 'Fémmegmunkálás, gépipar', 'name_en' => 'Machining and metal manufacturing'],
        '1071' => ['code' => '1071', 'name_hu' => 'Pékáru, élelmiszergyártás', 'name_en' => 'Manufacture of bread, food products'],
        '4120' => ['code' => '4120', 'name_hu' => 'Lakó- és nem lakó épület építése', 'name_en' => 'Construction of residential buildings'],
        '4690' => ['code' => '4690', 'name_hu' => 'Nem szakosodott nagykereskedelem', 'name_en' => 'Non-specialised wholesale trade'],
        '7022' => ['code' => '7022', 'name_hu' => 'Üzletviteli, egyéb vezetési tanácsadás', 'name_en' => 'Business and management consultancy'],
        '8621' => ['code' => '8621', 'name_hu' => 'Általános orvosi ellátás, egészségügy', 'name_en' => 'General medical practice activities'],
        '7219' => ['code' => '7219', 'name_hu' => 'Egyéb műszaki K+F kutatás-fejlesztés', 'name_en' => 'Other R&D on natural sciences and engineering'],
    ];

    /**
     * Map legacy Hungarian KSH TEÁOR'08 reference to modern TEÁOR'25 4-digit code.
     *
     * @param  string  $legacyCode  Legacy TEÁOR'08 code.
     * @return string TEÁOR'25 4-digit numeric code.
     */
    public function resolveTeaor08To25(string $legacyCode): string
    {
        $clean = preg_replace('/\D/', '', $legacyCode) ?? '';

        // Example mapping transitions between 2008 and 2025 standard classifications
        $mapping = [
            '6201' => '6201',
            '6202' => '6202',
            '2562' => '2562',
            '7210' => '7219',
        ];

        return $mapping[$clean] ?? $clean;
    }

    /**
     * Resolve revenue band from exact numeric revenue figure.
     *
     * @param  float|int  $exactRevenue  Exact annual revenue in HUF.
     * @return int Revenue band integer (1-6).
     */
    public function calculateRevenueBand(float|int $exactRevenue): int
    {
        if ($exactRevenue < 50_000_000) {
            return 1;
        }
        if ($exactRevenue < 200_000_000) {
            return 2;
        }
        if ($exactRevenue < 800_000_000) {
            return 3;
        }
        if ($exactRevenue < 4_000_000_000) {
            return 4;
        }
        if ($exactRevenue <= 20_000_000_000) {
            return 5;
        }

        return 6;
    }

    /**
     * Evaluate whether a company satisfies a grant revenue threshold.
     *
     * Reference: CR-03 Rule - If a program defines a threshold that falls strictly within a band
     * without exact revenue supplied, return INSUFFICIENT_DATA.
     *
     * @param  int  $revenueBand  Stored revenue band (1-6).
     * @param  float|null  $exactRevenue  Optional exact revenue in HUF.
     * @param  float  $requiredMinHuf  Minimum required revenue for funding program.
     * @return string 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_DATA'
     */
    public function evaluateRevenueThreshold(int $revenueBand, ?float $exactRevenue, float $requiredMinHuf): string
    {
        // When exact revenue is provided, evaluate deterministically
        if ($exactRevenue !== null) {
            return $exactRevenue >= $requiredMinHuf ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
        }

        $band = self::REVENUE_BANDS[$revenueBand] ?? null;
        if (! $band) {
            return 'INSUFFICIENT_DATA';
        }

        // If the minimum of the band exceeds the requirement, definitely eligible
        if ($band['min_huf'] >= $requiredMinHuf) {
            return 'ELIGIBLE';
        }

        // If the maximum of the band is strictly below the requirement, definitely not eligible
        if ($band['max_huf'] !== null && $band['max_huf'] < $requiredMinHuf) {
            return 'NOT_ELIGIBLE';
        }

        // Requirement falls strictly inside the band without exact revenue: return INSUFFICIENT_DATA
        return 'INSUFFICIENT_DATA';
    }
}
