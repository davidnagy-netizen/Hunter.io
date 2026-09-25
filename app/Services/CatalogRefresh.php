<?php

namespace App\Services;

use App\Exceptions\ApiError;
use App\Integrations\Catalog\CatalogFeedClient;
use App\Models\Opportunity;
use Illuminate\Support\Facades\DB;

class CatalogRefresh
{
    public function __construct(private CatalogFeedClient $feed) {}

    public function status(): array
    {
        $data = DB::table('api_crm_records')->where('subject_id', '_catalog_refresh')->value('data');

        return ['enabled' => (bool) config('fundor.catalog_feed_url')] + ($data ? json_decode($data, true) : ['runs' => 0, 'failures' => 0, 'lastAttemptAt' => null, 'lastSuccessAt' => null, 'lastError' => null, 'nextRunAt' => null]);
    }

    public function run(): array
    {
        $url = config('fundor.catalog_feed_url');
        if (! $url) {
            throw new ApiError('REFRESH_UNAVAILABLE', 503, 'A katalógus adatforrása nincs konfigurálva.');
        }
        $status = $this->status();
        $status['lastAttemptAt'] = now()->toISOString();
        try {
            $payload = $this->feed->fetch();
            DB::transaction(function () use ($payload) {
                foreach ($payload['opportunities'] as $o) {
                    $model = Opportunity::firstOrNew(['code' => $o['id']]);
                    // Curated records are maintained locally and cannot be overwritten by a feed.
                    if ($model->exists && ($model->curated || $model->isLoan())) {
                        continue;
                    }
                    $model->fill(['instrument_type' => 'grant', 'title' => $o['title'], 'program' => $o['program'], 'deadline' => $o['deadline'], 'intensity' => $o['intensity'],
                        'goals' => $o['goals'], 'hard_rules' => $o['hard'], 'soft_rules' => $o['soft'] ?? [], 'funding_min' => $o['fundingMin'] ?? 0,
                        'funding_max' => $o['fundingMax'] ?? 0, 'source_reference' => $o['sourceRef'] ?? $o['id'], 'source_url' => $o['sourceUrl'] ?? null,
                        'docs' => $o['docs'] ?? [], 'high_admin' => $o['highAdmin'] ?? false, 'status' => $o['status'] ?? 'open']);
                    $model->setAttribute('api_extra', json_encode($o, JSON_THROW_ON_ERROR));
                    $model->save();
                }
                Opportunity::grants()->where('curated', false)->whereNotIn('code', array_column($payload['opportunities'], 'id'))->update(['status' => 'closed']);
            });
            $status['runs'] = ($status['runs'] ?? 0) + 1;
            $status['lastSuccessAt'] = now()->toISOString();
            $status['lastError'] = null;
            $status['lastReport'] = ['received' => count($payload['opportunities'])];
            $this->persist($status);

            return ['ok' => true, 'total' => Opportunity::whereIn('status', ['open', 'forthcoming'])->count(), 'report' => $status['lastReport'], 'status' => $status];
        } catch (\Throwable $e) {
            report($e);
            $status['failures'] = ($status['failures'] ?? 0) + 1;
            $status['lastError'] = ['message' => 'Catalog feed could not be loaded or validated.', 'at' => now()->toISOString()];
            $this->persist($status);

            return ['ok' => false, 'error' => 'A katalógus frissítése sikertelen.', 'status' => $status];
        }
    }

    private function persist(array $status): void
    {
        unset($status['enabled']);
        DB::table('api_crm_records')->updateOrInsert(['subject_id' => '_catalog_refresh'], ['data' => json_encode($status, JSON_THROW_ON_ERROR)]);
    }
}
