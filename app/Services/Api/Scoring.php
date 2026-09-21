<?php

namespace App\Services\Api;

use Illuminate\Support\Carbon;

/** PHP counterpart of the five-factor engine in hunter-mvp.html. */
class Scoring
{
    public function rule(mixed $value, string $op, mixed $target): string
    {
        if ($value === null) {
            return 'unknown';
        }
        $pass = match ($op) {
            'between' => is_numeric($value) && is_array($target) && count($target) === 2 ? $value >= $target[0] && $value <= $target[1] : null,
            'in' => is_array($target) ? in_array($value, $target, true) : null,
            'not_in' => is_array($target) ? ! in_array($value, $target, true) : null,
            '>=' => is_numeric($value) && is_numeric($target) ? $value >= $target : null,
            '<=' => is_numeric($value) && is_numeric($target) ? $value <= $target : null,
            '==' => $value === $target || (is_numeric($value) && ! is_string($value) && is_numeric($target) && ! is_string($target) && $value == $target),
            'includes_any' => is_array($value) && is_array($target) ? count(array_intersect($value, $target)) > 0 : null,
            default => null,
        };

        return $pass === null ? 'unknown' : ($pass ? 'pass' : 'fail');
    }

    public function score(array $o, array $p, array $answers = [], string $lang = 'hu'): array
    {
        $en = $lang === 'en';
        $field = fn ($key) => $answers[$o['id'].':'.$key] ?? $answers[$key] ?? $p[$key] ?? null;
        $checks = [];
        $questions = [];
        foreach ($o['hard'] as $rule) {
            $value = $field($rule['field']);
            $status = $this->rule($value, $rule['op'], $rule['value']);
            $label = $rule['label_'.$lang] ?? $rule['label'] ?? $rule['field'];
            $checks[] = ['field' => $rule['field'], 'label' => $label, 'status' => $status, 'yourValue' => $value, 'required' => $rule['value'], 'operator' => $rule['op']];
            if ($status === 'unknown') {
                $questions[] = ['field' => $rule['field'], 'scope' => 'global'] + ($rule['quiz'] ?? ['q_hu' => $label, 'q_en' => $label, 'opts' => [['t_hu' => 'Igen', 't_en' => 'Yes', 'v' => true], ['t_hu' => 'Nem', 't_en' => 'No', 'v' => false]]]);
            }
        }
        $days = (int) now('UTC')->startOfDay()->diffInDays(Carbon::parse($o['deadline'], 'UTC')->startOfDay(), false);
        $conditions = [];
        if ($o['intensity'] < 1) {
            $conditions[] = round((1 - $o['intensity']) * 100).($en ? '% own contribution required' : '% saját forrás szükséges');
        }
        if ($days > 0 && $days <= 14) {
            $conditions[] = $en ? "Deadline approaching: {$days} days left" : "Közeli határidő: {$days} nap";
        }
        if ($o['highAdmin']) {
            $conditions[] = $en ? 'High administrative burden' : 'Magas adminisztrációs teher';
        }
        if ($o['consortium']['required'] ?? false) {
            $conditions[] = $en ? 'Consortium required' : 'Konzorcium szükséges';
        }
        if (! $o['awardsFunding']) {
            $conditions[] = $en ? 'This call does not award a grant' : 'Ez a felhívás nem nyújt támogatást';
        }
        $blocked = in_array('fail', array_column($checks, 'status'), true);
        $unknown = in_array('unknown', array_column($checks, 'status'), true) || ! $p;
        $verdict = $blocked ? 'NOT_ELIGIBLE' : ($unknown ? 'INSUFFICIENT_DATA' : ($conditions ? 'CONDITIONAL' : 'ELIGIBLE'));
        $elig = count($checks) ? array_sum(array_map(fn ($c) => $c['status'] === 'pass' ? 1 : ($c['status'] === 'unknown' ? .7 : 0), $checks)) / count($checks) : 1;
        $goals = $p['goals'] ?? [];
        $goalScore = count($o['goals']) ? count(array_intersect($o['goals'], $goals)) / count($o['goals']) : 0;
        $softPass = 0;
        $softTotal = 0;
        foreach ($o['soft'] as $rule) {
            $weight = $rule['weight'] ?? 0;
            $softTotal += $weight;
            if ($this->rule($rule['field'] === 'goals' ? $goals : $field($rule['field']), $rule['op'], $rule['value']) === 'pass') {
                $softPass += $weight;
            }
        }
        $softScore = $softTotal ? $softPass / $softTotal : $goalScore;
        $fit = .6 * $goalScore + .4 * $softScore;
        if (isset($o['goalScores'])) {
            $fit = .8 * (count($o['goals']) ? $goalScore : (($o['described'] ?? false) ? .1 : .3)) + .2 * $softScore;
        }
        if (isset($o['smeFit'], $p['orgType'])) {
            $fit *= .75 + .25 * (in_array($p['orgType'], ['sme', 'large']) ? $o['smeFit'] : 1);
        }
        $v = $p['investment_value'] ?? 0;
        $lo = $o['partnerShare']['minHuf'] ?? $o['fundingMin'] ?? 0;
        $hi = $o['partnerShare']['maxHuf'] ?? ($o['fundingMax'] ?: $o['fundingMin']);
        $support = min($v * $o['intensity'], $hi ?? 0);
        $size = .5;
        if ($o['fundingMin'] || $o['fundingMax']) {
            $band = $v >= $lo && $v <= $hi * 2 ? 1 : ($v < $lo ? ($lo ? max(.2, $v / $lo) : .5) : max(.4, $v ? $hi * 2 / $v : 0));
            $size = min(1, .7 * $band + .3 * min(1, $support / 3000000) * (.6 + $o['intensity'] * .4));
        }
        $timing = match (true) {
            $days <= 0 => 0, $days < 14 => .45, $days < 45 => .72, $days < 120 => .92, $days <= 240 => 1, default => .84
        };
        $feas = 1 - (1 - $o['intensity']) * .4 - min(count($o['docs']), 6) / 6 * .28 - ($o['highAdmin'] ? .18 : 0);
        if ($o['consortium']['required'] ?? false) {
            $feas -= match ($field('consortium_ready')) {
                true => .04, false => .22, default => .12
            };
        }
        if (($o['sourceSystem'] ?? '') === 'EU_FUNDING_TENDERS' && ($p['eu_experience'] ?? null) === false) {
            $feas -= .06;
        }
        $feas = max(.2, $feas);
        $factors = [];
        foreach (['elig' => [$elig, .35, 'Eligibility', 'Jogosultság'], 'fit' => [$fit, .25, 'Project fit', 'Projektilleszkedés'], 'size' => [$size, .15, 'Funding size', 'Támogatási összeg'], 'timing' => [$timing, .15, 'Timing', 'Időzítés'], 'feas' => [$feas, .10, 'Feasibility', 'Megvalósíthatóság']] as $key => [$value, $weight, $english, $hu]) {
            $factors[] = ['key' => $key, 'weight' => $weight, 'value' => round($value * 100, 2), 'label' => $en ? $english : $hu, 'detail' => ''];
        }
        $score = $blocked ? null : (int) round(100 * (.35 * $elig + .25 * $fit + .15 * $size + .15 * $timing + .10 * $feas));
        $bandKey = $score >= 85 ? 'strong' : ($score >= 70 ? 'relevant' : ($score >= 50 ? 'conditional' : 'low'));
        $labels = ['strong' => ['Nagyon erős lehetőség', 'Very strong opportunity'], 'relevant' => ['Releváns lehetőség', 'Relevant opportunity'], 'conditional' => ['Feltételes lehetőség', 'Conditional opportunity'], 'low' => ['Alacsony relevancia', 'Low relevance']];
        $ceiling = $o['partnerShare']['maxHuf'] ?? ($o['fundingMax'] ?: null);
        $grant = $ceiling === null ? $v * $o['intensity'] : min($v * $o['intensity'], $ceiling);

        return ['locked' => false, 'score' => $score, 'blocked' => $blocked, 'estimated' => ! $blocked && $unknown,
            'verdict' => $verdict, 'band' => $score === null ? null : ['key' => $bandKey, 'label' => $labels[$bandKey][$en ? 1 : 0]],
            'daysLeft' => $days, 'checks' => $checks, 'conditions' => $conditions, 'factors' => $blocked ? [] : $factors, 'questions' => $questions,
            'blockedReasons' => array_values(array_column(array_filter($checks, fn ($c) => $c['status'] === 'fail'), 'label')),
            'benchmark' => null, 'calculator' => ['projectValueHuf' => $v, 'intensity' => $o['intensity'], 'grantHuf' => $grant,
                'ownContributionHuf' => $v - $grant, 'cappedByCeiling' => $grant < $v * $o['intensity'], 'ceilingHuf' => $ceiling,
                'partnerShare' => $o['partnerShare'] ?? null, 'callGrantHuf' => $o['fundingMax'], 'currencyNote' => null]];
    }
}
