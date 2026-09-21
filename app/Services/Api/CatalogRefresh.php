<?php

namespace App\Services\Api;

use App\Models\Opportunity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class CatalogRefresh
{
    public function status(): array
    {
        $data = DB::table('api_crm_records')->where('subject_id', '_catalog_refresh')->value('data');

        return ['enabled' => (bool) config('fundor.catalog_feed_url')] + ($data ? json_decode($data, true) : ['runs' => 0, 'failures' => 0, 'lastAttemptAt' => null, 'lastSuccessAt' => null, 'lastError' => null, 'nextRunAt' => null]);
    }

    public function run()
    {
        $url = config('fundor.catalog_feed_url');
        if (! $url) {
            throw new ApiError('REFRESH_UNAVAILABLE', 503, 'A katalógus adatforrása nincs konfigurálva.');
        }
        $status = $this->status();
        $status['lastAttemptAt'] = now()->toISOString();
        try {
            // Only a deployment-controlled normalized feed is accepted; requests cannot choose a URL.
            $payload = Http::acceptJson()->timeout(60)->get($url)->throw()->json();
            Validator::make($payload ?? [], ['opportunities' => 'required|array|min:1', 'opportunities.*.id' => 'required|string|max:255|distinct',
                'opportunities.*.title' => 'required|string|max:255', 'opportunities.*.program' => 'required|string|max:255',
                'opportunities.*.deadline' => 'required|date_format:Y-m-d', 'opportunities.*.intensity' => 'required|numeric|min:0|max:1',
                'opportunities.*.goals' => 'present|array', 'opportunities.*.hard' => 'present|array',
                'opportunities.*.fundingMin' => 'nullable|numeric|min:0|max:9999999999999', 'opportunities.*.fundingMax' => 'nullable|numeric|min:0|max:9999999999999',
                'opportunities.*.status' => 'sometimes|in:open,forthcoming', 'opportunities.*.hard.*.field' => 'required|string',
                'opportunities.*.hard.*.op' => 'required|in:between,in,not_in,>=,<=,==,includes_any', 'opportunities.*.hard.*.value' => 'present',
                'opportunities.*.goals.*' => 'string', 'opportunities.*.docs' => 'sometimes|array', 'opportunities.*.docs.*' => 'string',
                'opportunities.*.soft' => 'sometimes|array', 'opportunities.*.soft.*.field' => 'required|string',
                'opportunities.*.soft.*.op' => 'required|in:between,in,not_in,>=,<=,==,includes_any', 'opportunities.*.soft.*.value' => 'present',
                'opportunities.*.soft.*.weight' => 'sometimes|numeric|min:0', 'opportunities.*.consortium' => 'sometimes|array',
                'opportunities.*.consortium.required' => 'sometimes|boolean', 'opportunities.*.summary' => 'sometimes|string',
                'opportunities.*.description' => 'sometimes|string', 'opportunities.*.smeFit' => 'sometimes|numeric|min:0|max:1',
                'opportunities.*.partnerShare' => 'sometimes|nullable|array', 'opportunities.*.partnerShare.minHuf' => 'sometimes|numeric|min:0',
                'opportunities.*.partnerShare.maxHuf' => 'sometimes|numeric|min:0', 'opportunities.*.sectors' => 'sometimes|array',
                'opportunities.*.applicantTypes' => 'sometimes|array', 'opportunities.*.goalScores' => 'sometimes|array'])->validate();
            DB::transaction(function () use ($payload) {
                foreach ($payload['opportunities'] as $o) {
                    $model = Opportunity::firstOrNew(['code' => $o['id']]);
                    // Curated records are maintained locally and cannot be overwritten by a feed.
                    if ($model->exists && $model->curated) {
                        continue;
                    }
                    $model->fill(['title' => $o['title'], 'program' => $o['program'], 'deadline' => $o['deadline'], 'intensity' => $o['intensity'],
                        'goals' => $o['goals'], 'hard_rules' => $o['hard'], 'soft_rules' => $o['soft'] ?? [], 'funding_min' => $o['fundingMin'] ?? 0,
                        'funding_max' => $o['fundingMax'] ?? 0, 'source_reference' => $o['sourceRef'] ?? $o['id'], 'source_url' => $o['sourceUrl'] ?? null,
                        'docs' => $o['docs'] ?? [], 'high_admin' => $o['highAdmin'] ?? false, 'status' => $o['status'] ?? 'open']);
                    $model->setAttribute('api_extra', json_encode($o, JSON_THROW_ON_ERROR));
                    $model->save();
                }
                Opportunity::where('curated', false)->whereNotIn('code', array_column($payload['opportunities'], 'id'))->update(['status' => 'closed']);
            });
            $status['runs'] = ($status['runs'] ?? 0) + 1;
            $status['lastSuccessAt'] = now()->toISOString();
            $status['lastError'] = null;
            $status['lastReport'] = ['received' => count($payload['opportunities'])];
            $this->persist($status);

            return response()->json(['ok' => true, 'total' => Opportunity::whereIn('status', ['open', 'forthcoming'])->count(), 'report' => $status['lastReport'], 'status' => $status]);
        } catch (\Throwable $e) {
            report($e);
            $status['failures'] = ($status['failures'] ?? 0) + 1;
            $status['lastError'] = ['message' => 'Catalog feed could not be loaded or validated.', 'at' => now()->toISOString()];
            $this->persist($status);

            return response()->json(['ok' => false, 'error' => 'A katalógus frissítése sikertelen.', 'status' => $status], 502);
        }
    }

    private function persist(array $status): void
    {
        unset($status['enabled']);
        DB::table('api_crm_records')->updateOrInsert(['subject_id' => '_catalog_refresh'], ['data' => json_encode($status, JSON_THROW_ON_ERROR)]);
    }
}
