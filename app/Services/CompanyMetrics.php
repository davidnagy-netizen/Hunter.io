<?php

declare(strict_types=1);

namespace App\Services;

use App\Services\Sector\TeaorService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/** CR-03: typed profile fields and geographic codes, independent of NAV office suffixes. */
final class CompanyMetrics
{
    public const COUNTIES = ['01' => 'Budapest', '02' => 'Baranya', '03' => 'Bács-Kiskun', '04' => 'Békés', '05' => 'Borsod-Abaúj-Zemplén', '06' => 'Csongrád-Csanád', '07' => 'Fejér', '08' => 'Győr-Moson-Sopron', '09' => 'Hajdú-Bihar', '10' => 'Heves', '11' => 'Komárom-Esztergom', '12' => 'Nógrád', '13' => 'Pest', '14' => 'Somogy', '15' => 'Szabolcs-Szatmár-Bereg', '16' => 'Jász-Nagykun-Szolnok', '17' => 'Tolna', '18' => 'Vas', '19' => 'Veszprém', '20' => 'Zala'];

    public const LEGAL_FORMS = ['kft', 'bt', 'zrt', 'nyrt', 'ev', 'kkt', 'cooperative'];

    /** Validate canonical fields. Amounts travel as decimal strings, never floating approximations. */
    public function validate(array $input): array
    {
        $data = Validator::make($input, [
            'legal_form' => ['required', Rule::in(self::LEGAL_FORMS)],
            'headcount' => 'required|integer|min:0|max:2147483647',
            'revenue_band' => 'required|integer|between:1,6',
            'exact_revenue' => ['nullable', 'regex:/^(?:0|[1-9][0-9]{0,12})(?:\.[0-9]{1,2})?$/D'],
            'county_code' => ['required', 'string', Rule::in(array_keys(self::COUNTIES))],
            'teaor_code' => ['required', 'string', function ($attribute, $value, $fail) {
                if (! app(TeaorService::class)->exists($value)) {
                    $fail('Érvénytelen TEÁOR’25 kód.');
                }
            }],
            'closed_business_years' => 'required|integer|between:0,255',
        ])->validate();
        $data['exact_revenue'] = $data['exact_revenue'] ?? null;
        if ($data['exact_revenue'] !== null) {
            $data['exact_revenue'] = (string) $data['exact_revenue'];
            $data['revenue_band'] = self::band($data['exact_revenue']);
        }

        return $data;
    }

    /** Integer HUF boundaries preserve cent precision without binary floating point. */
    public static function band(string $revenue): int
    {
        foreach (['50000000', '200000000', '800000000', '4000000000'] as $index => $limit) {
            if (bccomp($revenue, $limit, 2) < 0) {
                return $index + 1;
            }
        }

        return bccomp($revenue, '20000000000', 2) <= 0 ? 5 : 6;
    }
}
