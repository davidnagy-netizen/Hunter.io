<?php

namespace App\Http\Controllers\Api;

use App\Models\Lead;
use App\Services\Api\ApiError;
use App\Services\Api\Catalog;
use App\Services\Api\Profiles;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LeadController
{
    public function store(Request $r, Profiles $profiles, Catalog $catalog)
    {
        if (! $r->filled('email')) {
            throw new ApiError('EMAIL_REQUIRED');
        }
        if (Validator::make($r->only('email'), ['email' => 'required|email|max:200'])->fails()) {
            throw new ApiError('INVALID_EMAIL');
        }
        if ($r->input('consent') !== true) {
            throw new ApiError('CONSENT_REQUIRED');
        }
        $r->validate(['company' => 'sometimes|nullable|string|max:120', 'contactName' => 'sometimes|nullable|string|max:120', 'phone' => 'sometimes|nullable|string|max:40',
            'note' => 'sometimes|nullable|string|max:500', 'readiness' => 'sometimes|numeric', 'answers' => 'sometimes|array', 'profile' => 'sometimes|array', 'matchIds' => 'sometimes|array|max:5', 'matchIds.*' => 'string']);
        $email = mb_strtolower(trim($r->input('email')));
        $profile = array_intersect_key($r->input('profile', []), array_flip(['employees', 'region', 'county', 'industryId', 'teaor', 'orgType', 'goals', 'investment_value', 'closed_business_years']));
        $profile = $profile ? $profiles->normalize($profile) : [];
        $matches = $r->input('matchIds');
        if ($matches === null) {
            $rows = $profile ? $catalog->rows(['profile' => $profile, 'answers' => []]) : [];
            $matches = collect($rows)->where('blocked', false)->where('awardsFunding', true)->sortByDesc('score')->take(5)->pluck('id')->all();
        }
        for ($attempt = 0; ; $attempt++) {
            try {
                [$lead, $updated] = DB::transaction(function () use ($r, $email, $profile, $matches) {
                    $lead = Lead::whereRaw('LOWER(email) = ?', [$email])->lockForUpdate()->first();
                    $updated = (bool) $lead;
                    $lead ??= new Lead;
                    $lead->fill(['email' => $email, 'contact_name' => $r->input('contactName') ?? $lead->contact_name ?? '',
                        'company' => $r->input('company', $lead->company), 'phone' => $r->input('phone', $lead->phone), 'note' => $r->input('note', $lead->note),
                        'readiness_score' => $r->has('readiness') ? (int) round(max(0, min(100, (float) $r->input('readiness')))) : $lead->readiness_score,
                        'answers' => array_intersect_key($r->input('answers', []), array_flip(['employees', 'county', 'industryId', 'closed_business_years', 'goals', 'investment_value'])),
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

        return response()->json(['success' => true, 'id' => 'lead:'.$lead->id, 'updated' => $updated], $updated ? 200 : 201);
    }
}
