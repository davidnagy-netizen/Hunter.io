<?php

namespace Tests\Unit;

use App\Services\Api\Profiles;
use App\Services\Sector\SectorMap;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SectorMapTest extends TestCase
{
    /** Every NACE division 01–99 -> the sector the prototype engine assigned it (null = none). */
    private const EXPECTED = [
        '01' => 'agriculture', '02' => 'agriculture', '03' => 'agriculture', '04' => null, '05' => null, '06' => null, '07' => null, '08' => null, '09' => null,
        '10' => 'manufacturing', '11' => 'manufacturing', '12' => null, '13' => 'manufacturing', '14' => 'manufacturing', '15' => 'manufacturing',
        '16' => 'manufacturing', '17' => 'manufacturing', '18' => 'manufacturing', '19' => null, '20' => 'manufacturing', '21' => 'manufacturing',
        '22' => 'manufacturing', '23' => 'manufacturing', '24' => 'manufacturing', '25' => 'manufacturing', '26' => 'manufacturing', '27' => 'manufacturing',
        '28' => 'manufacturing', '29' => 'manufacturing', '30' => 'manufacturing', '31' => 'manufacturing', '32' => 'manufacturing', '33' => 'manufacturing',
        '34' => null, '35' => 'energy', '36' => 'energy', '37' => 'waste', '38' => 'waste', '39' => 'waste', '40' => null,
        '41' => 'construction', '42' => 'construction', '43' => 'construction', '44' => null, '45' => 'trade', '46' => 'trade', '47' => 'trade',
        '48' => null, '49' => 'transport', '50' => 'transport', '51' => 'transport', '52' => 'transport', '53' => 'transport', '54' => null,
        '55' => 'tourism', '56' => 'tourism', '57' => null, '58' => 'it', '59' => 'creative', '60' => 'creative', '61' => 'it', '62' => 'it', '63' => 'it',
        '64' => null, '65' => null, '66' => null, '67' => null, '68' => null, '69' => 'services', '70' => 'services', '71' => 'services', '72' => 'services',
        '73' => 'services', '74' => 'services', '75' => null, '76' => null, '77' => null, '78' => 'services', '79' => 'tourism', '80' => null, '81' => null,
        '82' => 'services', '83' => null, '84' => null, '85' => 'education', '86' => 'health', '87' => 'health', '88' => 'health', '89' => null,
        '90' => 'creative', '91' => 'creative', '92' => null, '93' => null, '94' => null, '95' => null, '96' => null, '97' => null, '98' => null, '99' => null,
    ];

    /** @return array<string, array{0: string, 1: ?string}> */
    public static function divisions(): array
    {
        $cases = [];
        foreach (self::EXPECTED as $division => $sector) {
            $cases["NACE $division"] = [(string) $division, $sector];
        }

        return $cases;
    }

    #[DataProvider('divisions')]
    public function test_every_division_maps_as_the_prototype_did(string $division, ?string $sector): void
    {
        $this->assertSame($sector, SectorMap::of($division), "NACE $division");
    }

    public function test_a_four_digit_teaor_code_uses_its_division(): void
    {
        $this->assertSame('it', SectorMap::of('6201'));
        $this->assertSame('manufacturing', SectorMap::of('2562'));
        $this->assertSame('energy', SectorMap::of('3511'));
    }

    public function test_a_missing_or_blank_code_has_no_sector(): void
    {
        $this->assertNull(SectorMap::of(null));
        $this->assertNull(SectorMap::of(''));
        $this->assertNull(SectorMap::of('  '));
    }

    public function test_a_sector_is_always_a_word_the_catalogs_rules_use(): void
    {
        $vocabulary = ['agriculture', 'construction', 'creative', 'education', 'energy', 'health', 'it', 'manufacturing', 'services', 'tourism', 'trade', 'transport', 'waste'];
        foreach (self::EXPECTED as $sector) {
            if ($sector !== null) {
                $this->assertContains($sector, $vocabulary);
            }
        }
    }

    public function test_the_profile_derives_it_and_ignores_a_stale_one(): void
    {
        $profiles = app(Profiles::class);
        $base = ['company' => 'x', 'employees' => 5, 'county' => 'Pest', 'closed_business_years' => 2, 'goals' => [], 'investment_value' => 1000000, 'funding_pref' => []];

        $this->assertSame('it', $profiles->normalize($base + ['teaor' => '62'])['sector']);
        $this->assertSame('energy', $profiles->normalize($base + ['teaor' => '35', 'sector' => 'services'])['sector'], 'a value saved before the fix must not survive');
        $this->assertArrayNotHasKey('sector', $profiles->normalize($base + ['teaor' => '99', 'sector' => 'services']));
    }
}
