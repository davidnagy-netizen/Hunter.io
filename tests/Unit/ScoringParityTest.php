<?php

namespace Tests\Unit;

use App\Services\Api\Profiles;
use App\Services\Api\Scoring;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The backend's scorer must give the same verdicts, scores and explanations as the engine the product was built on.
 * See tests/Fixtures/scoring/README.md for where the expectations come from.
 */
class ScoringParityTest extends TestCase
{
    private const FACTORS = ['elig', 'fit', 'size', 'timing', 'feas'];

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-09-21 12:00:00', 'UTC'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private static function load(string $name): array
    {
        return json_decode(file_get_contents(__DIR__.'/../Fixtures/scoring/'.$name), true, flags: JSON_THROW_ON_ERROR);
    }

    /** @return array<string, array{0: int}> */
    public static function companies(): array
    {
        $cases = [];
        foreach (self::load('expected.json')['cases'] as $i => $case) {
            $cases[$case['name']] = [$i];
        }

        return $cases;
    }

    /** @return array<string, array{0: int}> only the companies whose explanation texts were recorded */
    public static function companiesWithExplanations(): array
    {
        $cases = [];
        foreach (self::load('expected.json')['cases'] as $i => $case) {
            if (isset($case['details'])) {
                $cases[$case['name']] = [$i];
            }
        }

        return $cases;
    }

    private function profileFor(array $case): array
    {
        $profiles = app(Profiles::class);

        return $case['profile'] === null ? $profiles->demo() : $profiles->normalize($case['profile']);
    }

    #[DataProvider('companies')]
    public function test_verdicts_scores_and_factors_match_the_prototype_engine(int $index): void
    {
        $case = self::load('expected.json')['cases'][$index];
        $profile = $this->profileFor($case);
        $scoring = new Scoring;

        foreach (self::load('catalog.json') as $call) {
            $expected = $case['results'][$call['id']];
            $got = $scoring->score($call, $profile, $case['answers'], 'en');
            $where = $case['name'].' / '.$call['id'];

            $this->assertSame($expected['verdict'], $got['verdict'], "verdict: $where");
            $this->assertSame($expected['blocked'], $got['blocked'], "blocked: $where");
            $this->assertSame($expected['estimated'], $got['estimated'], "estimated: $where");
            $this->assertSame($expected['daysLeft'], $got['daysLeft'], "days left: $where");
            $this->assertSame($expected['score'], $got['score'], "score: $where");
            $this->assertCount($expected['failedRules'], $got['blockedReasons'], "failed rules: $where");
            foreach ($expected['factors'] as $key => $value) {
                $this->assertSame($value, array_column($got['factors'], 'value', 'key')[$key] ?? null, "factor $key: $where");
            }
            if ($expected['blocked']) {
                $this->assertSame([], $got['factors'], "a blocked call is not given a score breakdown: $where");
            }
        }
    }

    #[DataProvider('companiesWithExplanations')]
    public function test_every_factor_explanation_reads_exactly_as_the_prototype_wrote_it(int $index): void
    {
        $case = self::load('expected.json')['cases'][$index];
        $profile = $this->profileFor($case);
        $scoring = new Scoring;
        $checked = 0;

        foreach (self::load('catalog.json') as $call) {
            foreach (['en', 'hu'] as $lang) {
                $expected = $case['details'][$lang][$call['id']] ?? null;
                if ($expected === null) {
                    continue;
                }
                $factors = array_column($scoring->score($call, $profile, $case['answers'], $lang)['factors'], null, 'key');
                foreach ($expected as $key => [$label, $detail]) {
                    $this->assertSame($label, $factors[$key]['label'], "label $key/$lang: {$call['id']}");
                    $this->assertSame($detail, $factors[$key]['detail'], "detail $key/$lang: {$call['id']}");
                    $checked++;
                }
            }
        }
        $this->assertGreaterThan(50, $checked, 'the check must not pass by comparing nothing');
    }

    public function test_an_answered_consortium_question_changes_feasibility_the_way_a_profile_value_does(): void
    {
        $scoring = new Scoring;
        $profile = app(Profiles::class)->demo();
        $call = collect(self::load('catalog.json'))->first(fn ($c) => ($c['consortium']['required'] ?? false) && ! $c['highAdmin'] && $c['intensity'] > 0);
        $this->assertNotNull($call, 'the fixture has a consortium call');
        $feas = fn (array $answers) => array_column($scoring->score($call, $profile, $answers, 'en')['factors'], 'value', 'key')['feas'] ?? null;

        $unknown = $feas([]);
        $ready = $feas(['consortium_ready' => true]);
        $notReady = $feas(['consortium_ready' => false]);

        $this->assertGreaterThan($unknown, $ready, 'having partners makes it easier than not knowing');
        $this->assertLessThan($unknown, $notReady, 'having none makes it harder');
        $this->assertSame($ready, $feas([$call['id'].':consortium_ready' => true]), 'a per-call answer counts the same');
        $this->assertSame($notReady, $feas(['consortium_ready' => true, $call['id'].':consortium_ready' => false]), 'the per-call answer wins over the global one');
    }

    public function test_the_grant_calculator_is_project_value_times_intensity_capped_by_the_ceiling(): void
    {
        $scoring = new Scoring;
        $call = ['id' => 'x', 'deadline' => '2026-12-31', 'intensity' => 0.8, 'highAdmin' => false, 'awardsFunding' => true, 'goals' => [], 'hard' => [], 'soft' => [],
            'docs' => [], 'consortium' => ['required' => false], 'fundingMin' => 0, 'fundingMax' => 0, 'partnerShare' => null, 'described' => true];
        $profile = ['investment_value' => 30_000_000, 'goals' => []];

        $uncapped = $scoring->score($call, $profile)['calculator'];
        $this->assertEquals(24_000_000, $uncapped['grantHuf']);
        $this->assertEquals(6_000_000, $uncapped['ownContributionHuf']);
        $this->assertFalse($uncapped['cappedByCeiling']);

        $capped = $scoring->score(['fundingMax' => 10_000_000] + $call, $profile)['calculator'];
        $this->assertEquals(10_000_000, $capped['grantHuf']);
        $this->assertEquals(20_000_000, $capped['ownContributionHuf']);
        $this->assertTrue($capped['cappedByCeiling']);
    }
}
