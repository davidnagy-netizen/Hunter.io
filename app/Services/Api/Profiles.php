<?php

namespace App\Services\Api;

use App\Models\CompanyProfile;
use App\Models\User;
use App\Services\Sector\SectorMap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class Profiles
{
    private const MAP = ['company' => 'company_name', 'initials' => 'initials', 'employees' => 'employees',
        'region' => 'region_code', 'county' => 'county', 'industryId' => 'industry_id', 'teaor' => 'teaor_code',
        'revBand' => 'revenue_band', 'closed_business_years' => 'closed_business_years', 'goals' => 'goals',
        'investment_value' => 'planned_investment_value', 'projectName' => 'project_name', 'funding_pref' => 'funding_preferences',
        'de_minimis_ok' => 'de_minimis_ok', 'consortium_ready' => 'consortium_ready', 'eu_experience' => 'eu_experience',
        'country' => 'country', 'orgType' => 'org_type'];

    public function __construct(private Accounts $accounts) {}

    public function reference(): array
    {
        $r = json_decode(file_get_contents(resource_path('data/reference.json')), true, flags: JSON_THROW_ON_ERROR);
        $r['orgTypes'] = array_map(fn ($id, $hu, $en) => ['id' => $id, 'label_hu' => $hu, 'label_en' => $en],
            ['sme', 'large', 'research', 'university', 'ngo', 'public'],
            ['KKV', 'Nagyvállalat', 'Kutatóintézet', 'Egyetem', 'Civil szervezet', 'Közintézmény'],
            ['SME', 'Large enterprise', 'Research institute', 'University', 'NGO', 'Public body']);

        return $r;
    }

    public function normalize(array $p): array
    {
        Validator::make($p, ['company' => 'sometimes|string|max:255', 'employees' => 'sometimes|integer|min:0',
            'county' => 'sometimes|string|max:100', 'industryId' => 'sometimes|string|max:50',
            'closed_business_years' => 'sometimes|integer|min:0', 'investment_value' => 'sometimes|numeric|min:0|max:9999999999999',
            'goals' => 'sometimes|array', 'goals.*' => 'string', 'funding_pref' => 'sometimes|array', 'funding_pref.*' => 'string',
            'orgType' => 'sometimes|in:sme,large,research,university,ngo,public', 'teaor' => 'sometimes|string|max:10',
            'initials' => 'sometimes|string|max:10', 'region' => 'sometimes|string|max:10', 'country' => 'sometimes|string|max:10',
            'revBand' => 'sometimes|string|max:100', 'projectName' => 'sometimes|string|max:255',
            'de_minimis_ok' => 'sometimes|boolean', 'consortium_ready' => 'sometimes|boolean', 'eu_experience' => 'sometimes|boolean'])->validate();
        $p += ['company' => '', 'employees' => 0, 'county' => '', 'industryId' => '', 'closed_business_years' => 0,
            'goals' => [], 'investment_value' => 0, 'funding_pref' => [], 'country' => 'HU'];
        $p['employees'] = (int) $p['employees'];
        $p['closed_business_years'] = (int) $p['closed_business_years'];
        $p['investment_value'] = (float) $p['investment_value'];
        $p['orgType'] ??= $p['employees'] <= 249 ? 'sme' : 'large';
        $p['sizeClass'] = $p['employees'] < 10 ? 'micro' : ($p['employees'] < 50 ? 'small' : ($p['employees'] < 250 ? 'medium' : 'large'));
        $ref = $this->reference();
        foreach ($ref['regions'] as $region) {
            if (in_array($p['county'], $region['counties'], true)) {
                $p['region'] = $region['code'];
            }
        }
        foreach ($ref['industries'] as $industry) {
            if ($industry['id'] === $p['industryId']) {
                $p['teaor'] ??= $industry['teaor'];
            }
        }
        $p['region'] ??= '';
        $p['teaor'] ??= '';
        // The sector is derived from the activity code, in the vocabulary the calls' rules use (see SectorMap), and is
        // always recomputed: a profile saved earlier may carry a stale value, and a caller-supplied one cannot be told
        // apart from it. An activity in no sector leaves the field unset, which the engine treats as unknown.
        $sector = SectorMap::of($p['teaor']);
        if ($sector === null) {
            unset($p['sector']);
        } else {
            $p['sector'] = $sector;
        }

        return $p;
    }

    public function demo(): array
    {
        return $this->normalize(['company' => 'Alfa Gyártó Kft.', 'initials' => 'AG', 'employees' => 28, 'county' => 'Pest',
            'industryId' => 'manuf', 'teaor' => '28', 'revBand' => '500 M–1 Mrd Ft', 'closed_business_years' => 4,
            'goals' => ['digitalization', 'it', 'machinery'], 'investment_value' => 30000000, 'funding_pref' => ['non_refundable', 'EU', 'HU']]);
    }

    public function current(?User $u): ?array
    {
        $row = $u?->companyProfile()->first();
        if (! $row) {
            return null;
        }
        $p = json_decode($row->getRawOriginal('api_extra') ?? '{}', true) ?: [];
        foreach (self::MAP as $key => $column) {
            if ($row->$column !== null) {
                $p[$key] = $row->$column;
            }
        }

        return $this->normalize($p);
    }

    public function save(User $u, array $p, string $source, string $event = 'profile.saved'): array
    {
        $p = $this->normalize($p);

        return $this->accounts->mutate($u, function (&$s) use ($u, $p, $source, $event) {
            $old = $this->current($u);
            $changed = [];
            if ($old) {
                foreach (array_unique([...array_keys($old), ...array_keys($p)]) as $field) {
                    if (($old[$field] ?? null) !== ($p[$field] ?? null)) {
                        $changed[] = ['field' => $field, 'from' => $old[$field] ?? null, 'to' => $p[$field] ?? null];
                    }
                }
            }
            $columns = [];
            foreach (self::MAP as $key => $column) {
                $columns[$column] = $p[$key] ?? (in_array($key, ['initials', 'projectName', 'de_minimis_ok', 'consortium_ready', 'eu_experience']) ? null : '');
            }
            $model = $u->companyProfile()->first() ?? new CompanyProfile(['user_id' => $u->id]);
            $model->fill($columns);
            $model->setAttribute('api_extra', json_encode(array_diff_key($p, self::MAP), JSON_THROW_ON_ERROR));
            $model->save();
            $version = count($s['versions']) + 1;
            array_unshift($s['versions'], ['version' => $version, 'at' => now()->toISOString(), 'source' => $source, 'changed' => $changed, 'profile' => $p]);
            array_unshift($s['activity'], ['at' => now()->toISOString(), 'type' => $event, 'version' => $version]);

            return ['success' => true, 'profile' => $p, 'version' => $version, 'changed' => $changed];
        });
    }

    public function resolve(Request $r): array
    {
        $state = $r->user() ? $this->accounts->state($r->user()) : ['answers' => [], 'saved' => []];
        if ($r->isMethod('POST')) {
            $r->validate(['profile' => 'required|array', 'answers' => 'sometimes|array', 'saved' => 'sometimes|array', 'saved.*' => 'string']);
        }
        $body = $r->isMethod('POST') ? $r->json()->all() : [];
        foreach ($body['answers'] ?? [] as $value) {
            if (! is_scalar($value)) {
                throw new ApiError('INVALID_REQUEST');
            }
        }

        return ['profile' => isset($body['profile']) ? $this->normalize($body['profile']) : ($this->current($r->user()) ?? []),
            'answers' => array_replace($state['answers'], $body['answers'] ?? []), 'saved' => $body['saved'] ?? $state['saved']];
    }
}
