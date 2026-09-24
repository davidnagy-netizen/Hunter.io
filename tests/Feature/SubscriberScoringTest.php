<?php

namespace Tests\Feature;

use App\Models\Opportunity;
use App\Models\User;
use App\Services\Api\Catalog;
use App\Services\Api\Profiles;
use App\Services\Api\Scoring;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * What a subscriber's screens are built from: the server scores every call for their company, and the browser only
 * shows the result. Uses real EU calls (tests/Fixtures/scoring/catalog.json).
 */
class SubscriberScoringTest extends TestCase
{
    use RefreshDatabase;

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

    private function asUser(User $u): static
    {
        $token = bin2hex(random_bytes(32));
        DB::table('api_sessions')->insert(['token_hash' => hash('sha256', $token), 'user_id' => $u->id, 'expires_at' => now()->addDays(7)]);

        return $this->withCredentials()->withUnencryptedCookie('fundor_session', $token);
    }

    private function account(string $name, string $role = 'user', bool $subscribed = false): User
    {
        $u = User::create(['name' => $name, 'username' => $name, 'email' => $name.'@example.com', 'password' => 'test-password', 'role' => $role]);
        if ($subscribed) {
            $u->update(['subscription_plan' => 'monthly', 'subscription_expires_at' => now()->addDays(30)]);
        }

        return $u;
    }

    private function importCalls(): array
    {
        $calls = json_decode(file_get_contents(__DIR__.'/../Fixtures/scoring/catalog.json'), true);
        foreach ($calls as &$call) {
            $call['status'] = 'open';
        }
        config(['fundor.catalog_feed_url' => 'https://feed.example/catalog.json']);
        Http::fake(['feed.example/*' => Http::response(['opportunities' => $calls])]);
        $this->asUser($this->account('root', 'admin'))->postJson('/api/refresh', [])->assertOk();

        return $calls;
    }

    private function subscriberWithProfile(): static
    {
        $client = $this->asUser($this->account('sub', 'user', true));
        $client->postJson('/api/profile', ['profile' => app(Profiles::class)->demo(), 'source' => 'test'])->assertOk();

        return $client;
    }

    public function test_the_subscribers_catalog_arrives_already_scored_and_agrees_with_the_scorer(): void
    {
        $calls = $this->importCalls();
        $client = $this->subscriberWithProfile();
        $profile = app(Profiles::class)->demo();

        $response = $client->getJson('/api/catalog?lang=en')->assertOk()->assertJsonPath('gated', false);
        $rows = collect($response->json('opportunities'))->keyBy('id');
        $this->assertCount(count($calls), $rows);

        $scoring = app(Scoring::class);
        foreach ($rows as $id => $row) {
            foreach (['score', 'blocked', 'estimated', 'verdict', 'band', 'daysLeft', 'checks', 'conditions', 'factors', 'blockedReasons', 'calculator'] as $field) {
                $this->assertArrayHasKey($field, $row, "$field on $id");
            }
            $expected = $scoring->score(app(Catalog::class)->opportunity(Opportunity::where('code', $id)->first()), $profile, [], 'en');
            $this->assertSame($expected['score'], $row['score'], "score of $id");
            $this->assertSame($expected['verdict'], $row['verdict'], "verdict of $id");
        }
        $this->assertTrue($rows->contains(fn ($r) => $r['blocked']), 'some calls are ruled out for this company, with reasons');
        $this->assertTrue($rows->contains(fn ($r) => ! $r['blocked'] && $r['score'] > 0));
        $ruledOut = $rows->first(fn ($r) => $r['blocked']);
        $this->assertNotEmpty($ruledOut['blockedReasons']);
        $this->assertNull($ruledOut['score']);
    }

    public function test_the_subscribers_catalog_carries_the_same_totals_a_gated_visitor_gets(): void
    {
        $this->importCalls();
        $client = $this->subscriberWithProfile();

        $stats = $client->getJson('/api/catalog')->assertOk()->json('stats');
        $rows = collect($client->getJson('/api/catalog')->json('opportunities'))->filter(fn ($r) => $r['awardsFunding']);

        $this->assertSame($rows->count(), $stats['catalogTotal']);
        $this->assertSame($rows->where('blocked', false)->count(), $stats['eligible']);
        $this->assertSame($rows->where('blocked', true)->count(), $stats['blocked']);
        $this->assertSame($rows->filter(fn ($r) => ! $r['blocked'] && $r['score'] >= 85)->count(), $stats['strong']);
        $this->assertSame($rows->filter(fn ($r) => ! $r['blocked'] && $r['estimated'])->count(), $stats['needsAnswer']);
        $this->assertSame($rows->filter(fn ($r) => ! $r['blocked'] && $r['daysLeft'] >= 0 && $r['daysLeft'] <= 14)->count(), $stats['closingSoon']);
    }

    public function test_someone_without_a_subscription_still_gets_no_call_at_all_only_scored_teasers(): void
    {
        $this->importCalls();
        $client = $this->asUser($this->account('free'));
        $client->postJson('/api/profile', ['profile' => app(Profiles::class)->demo()])->assertOk();

        $response = $client->getJson('/api/catalog')->assertOk()->assertJsonPath('gated', true)->assertJsonPath('opportunities', []);
        $this->assertNotEmpty($response->json('teasers'));
        foreach ($response->json('teasers') as $teaser) {
            $this->assertTrue($teaser['locked']);
            $this->assertArrayNotHasKey('id', $teaser);
            $this->assertArrayNotHasKey('title', $teaser);
            $this->assertArrayNotHasKey('checks', $teaser);
        }
    }

    public function test_the_detail_explains_every_factor_and_the_grant_for_the_subscribers_company(): void
    {
        $this->importCalls();
        $client = $this->subscriberWithProfile();
        $id = collect($client->getJson('/api/catalog')->json('opportunities'))->first(fn ($r) => ! $r['blocked'])['id'];

        $call = $client->getJson('/api/opportunities/'.$id.'?lang=en')->assertOk()->json('opportunity');

        $this->assertFalse($call['locked']);
        $this->assertCount(5, $call['factors']);
        foreach ($call['factors'] as $factor) {
            $this->assertNotSame('', $factor['detail'], "the {$factor['key']} factor is explained");
        }
        $this->assertSame(['elig', 'fit', 'size', 'timing', 'feas'], array_column($call['factors'], 'key'));
        $this->assertEquals(30_000_000, $call['calculator']['projectValueHuf']);
        $this->assertNotEmpty($call['title']);
    }

    public function test_answering_a_question_moves_the_score_in_the_detail_and_in_the_catalog_and_it_sticks(): void
    {
        $this->importCalls();
        $client = $this->subscriberWithProfile();
        $call = collect($client->getJson('/api/catalog?lang=en')->json('opportunities'))
            ->first(fn ($r) => ! $r['blocked'] && ($r['consortium']['required'] ?? false));
        $this->assertNotNull($call, 'a consortium call the company is not ruled out of');

        $before = $client->getJson('/api/opportunities/'.$call['id'])->json('opportunity');
        $this->assertContains('consortium_ready', array_column($before['questions'], 'field'), 'the call asks about consortium readiness');

        $answered = $client->postJson('/api/opportunities/'.$call['id'].'/answer', ['field' => 'consortium_ready', 'value' => true, 'scope' => 'global'])
            ->assertOk()->json('opportunity');
        $this->assertNotContains('consortium_ready', array_column($answered['questions'], 'field'), 'answered, so no longer asked');
        $this->assertGreaterThan($before['score'], $answered['score'], 'being ready for a consortium makes the call more feasible');

        $again = collect($client->getJson('/api/catalog')->json('opportunities'))->firstWhere('id', $call['id']);
        $this->assertSame($answered['score'], $again['score'], 'the catalog reflects the stored answer');
    }
}
