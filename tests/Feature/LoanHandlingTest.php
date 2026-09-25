<?php

namespace Tests\Feature;

use App\Integrations\Catalog\CatalogFeedClient;
use App\Models\Opportunity;
use App\Models\User;
use App\Services\CatalogRefresh;
use App\Services\Scoring;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LoanHandlingTest extends TestCase
{
    use RefreshDatabase;

    private function loanData(): array
    {
        return [
            'code' => 'reviewed-loan', 'instrument_type' => 'subsidised_loan',
            'title' => 'Private loan title', 'program' => 'Private loan programme',
            'deadline' => now()->addYear()->toDateString(), 'status' => 'open',
            'effective_from_date' => today()->toDateString(), 'last_verified_date' => today()->toDateString(),
            'source_document_reference' => 'Business Rules TEST section 1',
            'source_reference' => 'Business Rules TEST section 1',
            'loan_terms' => 'Private manually reviewed terms', 'manual_reviewed_by' => 'Test reviewer',
            'curated' => true, 'funding_min' => 0, 'funding_max' => 0, 'intensity' => 0,
        ];
    }

    private function apiSession(User $user): void
    {
        $token = bin2hex(random_bytes(32));
        DB::table('api_sessions')->insert(['token_hash' => hash('sha256', $token), 'user_id' => $user->id, 'expires_at' => now()->addDay()]);
        $this->withCredentials()->withUnencryptedCookie('fundor_session', $token);
    }

    public function test_free_visitors_only_get_counts_and_categories_and_the_public_disclaimer(): void
    {
        Opportunity::create($this->loanData());
        Opportunity::create(array_replace($this->loanData(), ['code' => 'future', 'effective_from_date' => now()->addMonth()->toDateString()]));
        $response = $this->getJson('/api/loans?lang=en')->assertOk()
            ->assertJsonPath('availableCount', 1)->assertJsonPath('categories.0.type', 'subsidised_loan')
            ->assertJsonPath('loans', [])->assertJsonPath('gated', true)
            ->assertJsonPath('eligibleCount', null)
            ->assertJsonPath('evaluationStatus', 'BLOCKED_PENDING_MNB_LEGAL_OPINION');
        $this->assertStringContainsString('not credit recommendations', $response->json('disclaimer'));
        foreach (['Private loan title', 'Private loan programme', 'Private manually reviewed terms', 'Business Rules TEST'] as $secret) {
            $this->assertStringNotContainsString($secret, $response->getContent());
            $this->assertStringNotContainsString($secret, $this->getJson('/api/meta')->getContent());
        }
        $user = User::factory()->create();
        $this->apiSession($user);
        $this->getJson('/api/loans')->assertOk()->assertJsonPath('loans', [])->assertJsonPath('availableCount', 1);
    }

    public function test_plus_details_never_include_grant_scores_and_expired_access_is_locked(): void
    {
        Opportunity::create($this->loanData());
        $user = User::factory()->create(['subscription_plan' => 'monthly', 'subscription_expires_at' => now()->addDay()]);
        $this->apiSession($user);
        $this->getJson('/api/loans')->assertOk()->assertJsonPath('gated', false)
            ->assertJsonPath('loans.0.terms', 'Private manually reviewed terms')
            ->assertJsonPath('loans.0.source_document_reference', 'Business Rules TEST section 1')
            ->assertJsonMissingPath('loans.0.score')->assertJsonMissingPath('loans.0.grantHuf');
        $this->getJson('/api/catalog')->assertOk()->assertJsonPath('opportunities', []);
        $this->getJson('/api/search')->assertOk()->assertJsonPath('results', []);
        $this->getJson('/api/opportunities/reviewed-loan')->assertNotFound();
        $user->update(['subscription_expires_at' => now()->subDay()]);
        $this->getJson('/api/loans')->assertOk()->assertJsonPath('gated', true)->assertJsonPath('loans', []);
    }

    public function test_model_requires_every_provenance_field_and_manual_review(): void
    {
        foreach (['effective_from_date', 'source_document_reference', 'last_verified_date', 'manual_reviewed_by', 'loan_terms', 'curated'] as $field) {
            try {
                Opportunity::create(array_replace($this->loanData(), [$field => null]));
                $this->fail('Accepted missing '.$field);
            } catch (ValidationException $e) {
                $this->assertArrayHasKey($field, $e->errors());
            }
        }
        $this->assertDatabaseCount('opportunities', 0);
    }

    public function test_database_rejects_invalid_enum_and_unreviewed_debt_on_insert_and_update(): void
    {
        foreach (['invalid', 'subsidised_loan', 'guarantee', 'combined'] as $type) {
            $data = array_replace($this->loanData(), ['instrument_type' => $type, 'source_document_reference' => null]);
            try {
                DB::table('opportunities')->insert($data);
                $this->fail('Accepted invalid insert for '.$type);
            } catch (QueryException $e) {
                $this->assertStringContainsString('CR-02', $e->getMessage());
            }
        }
        $loan = Opportunity::create($this->loanData());
        $this->expectException(QueryException::class);
        DB::table('opportunities')->where('id', $loan->id)->update(['source_document_reference' => ' ']);
    }

    public function test_all_debt_types_are_rejected_by_grant_scoring(): void
    {
        foreach (['subsidised_loan', 'guarantee', 'combined', 'invalid'] as $type) {
            try {
                app(Scoring::class)->score(['instrument_type' => $type], []);
                $this->fail('Scored '.$type);
            } catch (\InvalidArgumentException $e) {
                $this->assertStringContainsString('CR-02', $e->getMessage());
            }
        }
    }

    public function test_feed_rejects_debt_and_missing_classification_without_mutating_catalog(): void
    {
        Opportunity::create($this->loanData());
        config(['fundor.catalog_feed_url' => 'https://feed.example/catalog']);
        foreach (['subsidised_loan', 'guarantee', 'combined', null] as $type) {
            $record = ['id' => 'feed-loan', 'title' => 'Loan', 'program' => 'Test', 'deadline' => '2027-12-31', 'intensity' => 0, 'goals' => [], 'hard' => []];
            if ($type !== null) {
                $record['instrument_type'] = $type;
            }
            Http::fake(['feed.example/*' => Http::response(['opportunities' => [$record]])]);
            $this->assertFalse(app(CatalogRefresh::class)->run()['ok']);
            $this->assertDatabaseCount('opportunities', 1);
            $this->assertDatabaseHas('opportunities', ['code' => 'reviewed-loan', 'status' => 'open']);
        }
    }

    public function test_grant_refresh_cannot_overwrite_or_close_manually_reviewed_loans(): void
    {
        Opportunity::create($this->loanData());
        config(['fundor.catalog_feed_url' => 'https://feed.example/catalog']);
        $record = ['id' => 'reviewed-loan', 'instrument_type' => 'grant', 'title' => 'Overwrite', 'program' => 'Test', 'deadline' => '2027-12-31', 'intensity' => 0, 'goals' => [], 'hard' => []];
        foreach (['reviewed-loan', 'new-grant'] as $code) {
            $record['id'] = $code;
            Http::fake(['feed.example/*' => Http::response(['opportunities' => [$record]])]);
            $this->assertTrue(app(CatalogRefresh::class)->run()['ok']);
            $this->assertDatabaseHas('opportunities', ['code' => 'reviewed-loan', 'title' => 'Private loan title', 'status' => 'open', 'instrument_type' => 'subsidised_loan']);
        }
    }

    public function test_kavosz_hosts_are_rejected_before_any_request(): void
    {
        Http::fake();
        foreach (['https://kavosz.hu/data', 'https://www.kavosz.hu/data', 'https://KAVOSZ.HU./data'] as $url) {
            config(['fundor.catalog_feed_url' => $url]);
            try {
                app(CatalogFeedClient::class)->fetch();
                $this->fail('Fetched '.$url);
            } catch (\InvalidArgumentException $e) {
                $this->assertStringContainsString('manual document review', $e->getMessage());
            }
        }
        Http::assertNothingSent();
    }

    public function test_feed_redirects_are_not_followed(): void
    {
        config(['fundor.catalog_feed_url' => 'https://feed.example/catalog']);
        Http::fake(['feed.example/*' => Http::response('', 302, ['Location' => 'https://kavosz.hu/'])]);
        try {
            app(CatalogFeedClient::class)->fetch();
            $this->fail('Accepted a redirect');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('without redirects', $e->getMessage());
        }
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request->toPsrRequest()->getUri()->getHost() === 'feed.example');
    }

    public function test_manual_import_requires_attestation_and_performs_no_http_requests(): void
    {
        Http::fake();
        $path = tempnam(sys_get_temp_dir(), 'fundor-loan-');
        try {
            file_put_contents($path, json_encode($this->loanData(), JSON_THROW_ON_ERROR));
            $this->artisan('fundor:import-reviewed-loan', ['file' => $path])->assertFailed();
            $this->assertDatabaseCount('opportunities', 0);
            $this->artisan('fundor:import-reviewed-loan', ['file' => $path, '--reviewed-by' => 'Reviewer 42', '--confirm-manual-review' => true])->assertSuccessful();
            $this->assertDatabaseHas('opportunities', ['code' => 'reviewed-loan', 'manual_reviewed_by' => 'Reviewer 42', 'curated' => true, 'funding_max' => 0]);
            Http::assertNothingSent();
        } finally {
            unlink($path);
        }
    }
}
