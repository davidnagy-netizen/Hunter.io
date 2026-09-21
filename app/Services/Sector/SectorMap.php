<?php

declare(strict_types=1);

namespace App\Services\Sector;

/**
 * Maps a company's TEÁOR/NACE activity code to the sector vocabulary the funding calls' rules are written in
 * (`sector in [...]` in `hard`/`soft` rules): agriculture, construction, creative, education, energy, health,
 * it, manufacturing, services, tourism, trade, transport, waste.
 *
 * Only the first two digits (the division) matter, so a TEÁOR'25 four-digit code like 6201 and a division like
 * 62 give the same answer. A division that belongs to no sector returns null — the rules then answer
 * "unknown" and the eligibility engine asks, instead of failing the company on a sector it was never in.
 *
 * The table is the one the prototype engine used (`SECTOR_NACE` in its taxonomy), and
 * `tests/Unit/SectorMapTest.php` pins every division 01–99.
 */
final class SectorMap
{
    /** @var array<string, list<string>> */
    public const DIVISIONS = [
        'manufacturing' => ['10', '11', '13', '14', '15', '16', '17', '18', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33'],
        'it' => ['58', '61', '62', '63'],
        'energy' => ['35', '36'],
        'construction' => ['41', '42', '43'],
        'transport' => ['49', '50', '51', '52', '53'],
        'agriculture' => ['01', '02', '03'],
        'trade' => ['45', '46', '47'],
        'health' => ['86', '87', '88', '21'],
        'creative' => ['59', '60', '90', '91'],
        'services' => ['69', '70', '71', '72', '73', '74', '78', '82'],
        'tourism' => ['55', '56', '79'],
        'waste' => ['37', '38', '39'],
        'education' => ['85'],
    ];

    /** First match wins, in the order above (division 21 is manufacturing, not health). */
    public static function of(?string $teaor): ?string
    {
        if ($teaor === null || trim($teaor) === '') {
            return null;
        }
        $division = substr(str_pad(preg_replace('/\D/', '', $teaor) ?? '', 2, '0', STR_PAD_LEFT), 0, 2);
        foreach (self::DIVISIONS as $sector => $divisions) {
            if (in_array($division, $divisions, true)) {
                return $sector;
            }
        }

        return null;
    }
}
