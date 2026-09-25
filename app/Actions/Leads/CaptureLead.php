<?php

namespace App\Actions\Leads;

use App\Models\Lead;
use App\Services\Catalog;
use App\Services\Profiles;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Fluent;

class CaptureLead
{
    public function __construct(private Profiles $profiles, private Catalog $catalog) {}

    public function execute(array $data): array
    {
        $input = new Fluent($data);
        $email = mb_strtolower(trim($input->get('email')));
        $profile = array_intersect_key($input->get('profile', []), array_flip(['employees', 'region', 'county', 'industryId', 'teaor', 'orgType', 'goals', 'investment_value', 'closed_business_years']));
        $profile = $profile ? $this->profiles->normalize($profile) : [];
        $matches = $input->get('matchIds');
        if ($matches === null) {
            $rows = $profile ? $this->catalog->rows(['profile' => $profile, 'answers' => []]) : [];
            $matches = collect($rows)->where('blocked', false)->where('awardsFunding', true)->sortByDesc('score')->take(5)->pluck('id')->all();
        }
        for ($attempt = 0; ; $attempt++) {
            try {
                [$lead, $updated] = DB::transaction(function () use ($input, $email, $profile, $matches) {
                    $lead = Lead::whereRaw('LOWER(email) = ?', [$email])->lockForUpdate()->first();
                    $updated = (bool) $lead;
                    $lead ??= new Lead;
                    $lead->fill(['email' => $email, 'contact_name' => $input->get('contactName') ?? $lead->contact_name ?? '',
                        'company' => $input->get('company', $lead->company), 'phone' => $input->get('phone', $lead->phone), 'note' => $input->get('note', $lead->note),
                        'readiness_score' => $input->has('readiness') ? (int) round(max(0, min(100, (float) $input->get('readiness')))) : $lead->readiness_score,
                        'answers' => array_intersect_key($input->get('answers', []), array_flip(['employees', 'county', 'industryId', 'closed_business_years', 'goals', 'investment_value'])),
                        'stage' => $lead->stage ?? 'lead', 'source' => 'assessment']);
                    $lead->setAttribute('capture_key', hash('sha256', $email));
                    $lead->setAttribute('api_extra', json_encode(['profile' => $profile, 'matchIds' => $matches, 'consentAt' => now()->toISOString()], JSON_THROW_ON_ERROR));
                    $lead->save();

                    return [$lead, $updated];
                });
                break;
            } catch (UniqueConstraintViolationException $e) {
                // A concurrent first submission won the unique capture key. Retry as an update.
                if ($attempt >= 1) {
                    throw $e;
                }
            }
        }

        return ['success' => true, 'id' => 'lead:'.$lead->id, 'updated' => $updated];
    }
}
