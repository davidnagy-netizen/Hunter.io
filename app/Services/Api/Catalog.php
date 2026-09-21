<?php

namespace App\Services\Api;

use App\Models\Opportunity;
use Illuminate\Support\Carbon;

class Catalog
{
    public function __construct(private Scoring $scoring) {}

    public function opportunity(Opportunity $o): array
    {
        $extra = json_decode($o->getRawOriginal('api_extra') ?? '{}', true) ?: [];
        foreach (['budget', 'goalScores'] as $map) {
            if (array_key_exists($map, $extra)) {
                $extra[$map] = (object) $extra[$map];
            }
        }
        if (isset($extra['consortium'])) {
            $extra['consortium'] += ['required' => false];
        }
        if (isset($extra['partnerShare']) && $extra['partnerShare'] === []) {
            $extra['partnerShare'] = null;
        }

        return array_replace($extra, ['id' => $o->code, 'program' => $o->program, 'title' => $o->title,
            'deadline' => $o->deadline->toDateString(), 'intensity' => $o->intensity, 'goals' => $o->goals ?? [],
            'hard' => $o->hard_rules ?? [], 'soft' => $o->soft_rules ?? [], 'fundingMin' => (float) $o->funding_min,
            'fundingMax' => (float) $o->funding_max, 'sourceRef' => $o->source_reference, 'sourceUrl' => $o->source_url,
            'highAdmin' => $o->high_admin, 'curated' => $o->curated, 'isNew' => $o->is_new, 'docs' => $o->docs ?? [],
            'status' => $o->status]) + ['summary' => '', 'programShort' => $o->program, 'awardsFunding' => true,
                'consortium' => ['required' => false], 'partnerShare' => null, 'applicantTypes' => [], 'sectors' => []];
    }

    public function trim(array $o): array
    {
        unset($o['description'], $o['conditionsHtml'], $o['goalEvidence'], $o['deadlines']);
        $o['summary'] = mb_substr($o['summary'] ?? '', 0, 240);

        return $o;
    }

    public function unscored(array $row): array
    {
        return $this->trim(array_diff_key($row, array_flip(['locked', 'score', 'blocked', 'estimated', 'verdict', 'band', 'daysLeft', 'checks', 'conditions', 'factors', 'questions', 'blockedReasons', 'benchmark', 'calculator'])));
    }

    public function rows(array $state, string $lang = 'hu', bool $forthcoming = false): array
    {
        return Opportunity::whereIn('status', $forthcoming ? ['open', 'forthcoming'] : ['open'])->orderBy('code')->get()->map(function ($model) use ($state, $lang) {
            $o = $this->opportunity($model);

            return array_replace($o, $this->scoring->score($o, $state['profile'], $state['answers'], $lang));
        })->all();
    }

    public function teaser(array $o, int $index): array
    {
        return ['ref' => 't'.$index, 'locked' => true, 'score' => $o['score'], 'band' => $o['band'], 'estimated' => $o['estimated'],
            'grantHuf' => $o['calculator']['projectValueHuf'] * $o['intensity'], 'fundingMax' => $o['fundingMax'],
            'intensity' => $o['intensity'], 'closingSoon' => $o['daysLeft'] >= 0 && $o['daysLeft'] <= 30];
    }

    public function locked(array $o): array
    {
        return ['locked' => true, 'id' => null, 'title' => null, 'program' => null, 'deadline' => null,
            'score' => $o['score'], 'verdict' => $o['verdict'], 'blocked' => $o['blocked'], 'estimated' => $o['estimated'],
            'fundingMax' => $o['fundingMax'], 'intensity' => $o['intensity'], 'grantHuf' => $o['calculator']['projectValueHuf'] * $o['intensity'],
            'band' => $o['band'], 'closingSoon' => $o['daysLeft'] >= 0 && $o['daysLeft'] <= 30,
            'description' => '', 'checks' => [], 'conditions' => [], 'factors' => [], 'questions' => [], 'docs' => [],
            'calculator' => null, 'benchmark' => null];
    }

    public function metadata(): array
    {
        $built = Opportunity::max('updated_at');

        return ['builtAt' => $built ? Carbon::parse($built)->toISOString() : null,
            'referenceDate' => now('UTC')->toDateString(), 'eurHuf' => config('fundor.eur_huf') !== null ? (float) config('fundor.eur_huf') : null];
    }

    public function find(string $id): Opportunity
    {
        return Opportunity::where('code', $id)->whereIn('status', ['open', 'forthcoming'])->first() ?? throw new ApiError('NO_SUCH_OPPORTUNITY', 404);
    }

    public function stats(array $rows): array
    {
        return ['catalogTotal' => count($rows), 'openTotal' => count(array_filter($rows, fn ($o) => $o['status'] === 'open')),
            'eligible' => count(array_filter($rows, fn ($o) => ! $o['blocked'])), 'blocked' => count(array_filter($rows, fn ($o) => $o['blocked'])),
            'strong' => count(array_filter($rows, fn ($o) => ! $o['blocked'] && $o['score'] >= 85)),
            'closingSoon' => count(array_filter($rows, fn ($o) => ! $o['blocked'] && $o['daysLeft'] >= 0 && $o['daysLeft'] <= 14)),
            'needsAnswer' => count(array_filter($rows, fn ($o) => ! $o['blocked'] && $o['estimated']))];
    }
}
