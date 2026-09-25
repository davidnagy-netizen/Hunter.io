<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Opportunity;
use App\Models\User;
use App\Services\CatalogRefresh;
use App\Services\Profiles;
use Illuminate\Console\Command;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

/** Records actual API responses without using the application's database or live vendors. */
class GenerateApiFixtures extends Command
{
    protected $signature = 'fundor:generate-api-fixtures {--output= : Output directory; defaults to resources/js/test/fixtures/api}';

    protected $description = 'Generate React API fixtures using an isolated in-memory database';

    public function handle(): int
    {
        if (app()->isProduction()) {
            $this->error('Fixture generation is unavailable in production.');

            return self::FAILURE;
        }
        $settings = [
            'database.default' => 'fundor_fixture_generation',
            'database.connections.fundor_fixture_generation' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true],
            'cache.default' => 'fundor_fixture_generation',
            'cache.stores.fundor_fixture_generation' => ['driver' => 'array', 'serialize' => false],
            'session.driver' => 'array',
            'fundor.catalog_feed_url' => 'https://feed.example/catalog.json',
            'nav.base_url' => 'https://api-test.onlineszamla.nav.gov.hu/invoiceService/v3',
            'nav.login' => 'technical', 'nav.password' => 'test-secret', 'nav.tax_number' => '12345676',
            'nav.signature_key' => 'sign-key', 'nav.software_id' => 'HU12345676FUNDOR001',
            'nav.developer_name' => 'Fundor', 'nav.developer_contact' => 'developer@fundor.hu',
        ];
        $previous = config()->getMany(array_keys($settings));
        $http = Http::getFacadeRoot();
        $clock = Carbon::getTestNow();
        $request = app('request');
        try {
            config($settings);
            DB::purge('fundor_fixture_generation');
            Http::swap(new Factory);
            Http::preventStrayRequests();
            Carbon::setTestNow(Carbon::parse('2026-09-21 12:00:00', 'UTC'));
            Artisan::call('migrate', ['--database' => 'fundor_fixture_generation', '--force' => true]);
            $out = $this->option('output') ?: resource_path('js/test/fixtures/api');
            File::ensureDirectoryExists($out);
            $this->record($out);

            return self::SUCCESS;
        } finally {
            DB::purge('fundor_fixture_generation');
            Cache::forgetDriver('fundor_fixture_generation');
            config($previous);
            Http::swap($http);
            Carbon::setTestNow($clock);
            app()->instance('request', $request);
        }
    }

    private function record(string $out): void
    {
        $root = base_path();
        $http = app()->make(Kernel::class);

        /** Calls the API like a browser on the same origin would. */
        $call = function (string $method, string $uri, ?array $body = null, ?string $token = null) use ($http): array {
            $request = Request::create('http://localhost/api'.$uri, $method, [], $token ? ['fundor_session' => $token] : [], [], [
                'HTTP_ACCEPT' => 'application/json', 'HTTP_ORIGIN' => 'http://localhost', 'CONTENT_TYPE' => 'application/json',
            ], $body === null ? null : json_encode($body));
            $response = $http->handle($request);
            $http->terminate($request, $response);
            if ($response->getStatusCode() >= 400) {
                throw new \RuntimeException("FAILED $method $uri -> {$response->getStatusCode()} {$response->getContent()}");
            }

            return json_decode($response->getContent(), true, flags: JSON_THROW_ON_ERROR);
        };

        $account = function (string $name, string $role = 'user', bool $subscribed = false): string {
            $u = User::create(['name' => $name, 'username' => $name, 'email' => $name.'@example.test', 'password' => bin2hex(random_bytes(16)), 'role' => $role, 'company' => 'Alfa Gyártó Kft.']);
            if ($subscribed) {
                $u->update(['subscription_plan' => 'monthly', 'subscription_expires_at' => now()->addDays(30)]);
            }
            $token = bin2hex(random_bytes(32));
            DB::table('api_sessions')->insert(['token_hash' => hash('sha256', $token), 'user_id' => $u->id, 'expires_at' => now()->addDays(7)]);

            return $token;
        };

        $save = function (string $name, array $data) use ($out): void {
            file_put_contents("$out/$name.json", json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");
            $this->line("  $name.json");
        };

        // 1. Load the calls (all 48, then keep 12 that cover the cases the screens branch on).
        $calls = json_decode(file_get_contents($root.'/tests/Fixtures/scoring/catalog.json'), true);
        foreach ($calls as &$c) {
            $c['status'] = 'open';
            $c['instrument_type'] = 'grant';
        }
        unset($c);
        config(['fundor.catalog_feed_url' => 'https://feed.example/catalog.json']);
        Http::fake(['feed.example/*' => Http::response(['opportunities' => $calls]),
            '*queryTaxpayer' => Http::response(file_get_contents(base_path('tests/Fixtures/nav/taxpayer.xml')), 200, ['Content-Type' => 'application/xml'])]);
        app(CatalogRefresh::class)->run();

        $demo = app(Profiles::class)->demo();
        $sub = $account('subscriber', 'user', true);
        $free = $account('free');
        $call('POST', '/profile', ['profile' => $demo, 'source' => 'fixture'], $sub);
        $call('POST', '/profile', ['profile' => $demo, 'source' => 'fixture'], $free);

        $rows = collect($call('GET', '/catalog?lang=en', null, $sub)['opportunities'])->keyBy('id');
        $chosen = [];
        $take = function (callable $filter, int $n) use (&$chosen, $rows): void {
            foreach ($rows->filter($filter)->sortBy('id') as $id => $r) {
                if ($n <= 0) {
                    return;
                }
                if (! in_array($id, $chosen, true)) {
                    $chosen[] = $id;
                    $n--;
                }
            }
        };
        $take(fn ($r) => ! $r['blocked'] && ($r['consortium']['required'] ?? false) && $r['score'] >= 50, 2);
        $take(fn ($r) => $r['blocked'], 3);
        $take(fn ($r) => ! $r['blocked'] && $r['estimated'], 2);
        $take(fn ($r) => ! $r['blocked'] && ! $r['estimated'], 2);
        $take(fn ($r) => ! empty($r['partnerShare']), 1);
        $take(fn ($r) => ! $r['blocked'] && $r['daysLeft'] >= 0 && $r['daysLeft'] <= 30, 1);
        $take(fn ($r) => ! $r['blocked'], 12);
        $chosen = array_slice($chosen, 0, 12);
        Opportunity::whereNotIn('code', $chosen)->delete();

        // 2. Record.
        $this->info("Writing fixtures to $out");
        $catalogHu = $call('GET', '/catalog?lang=hu', null, $sub);
        $catalogEn = $call('GET', '/catalog?lang=en', null, $sub);
        $byId = collect($catalogEn['opportunities'])->keyBy('id');
        $ids = [
            'consortium' => $byId->first(fn ($r) => ! $r['blocked'] && ($r['consortium']['required'] ?? false))['id'],
            'blocked' => $byId->first(fn ($r) => $r['blocked'])['id'],
            'estimated' => $byId->first(fn ($r) => ! $r['blocked'] && $r['estimated'])['id'],
            'plain' => $byId->first(fn ($r) => ! $r['blocked'] && ! $r['estimated'] && ! ($r['consortium']['required'] ?? false))['id'] ?? $byId->first(fn ($r) => ! $r['blocked'])['id'],
        ];
        $save('catalog.subscriber.hu', $catalogHu);
        $save('catalog.subscriber.en', $catalogEn);
        $save('catalog.gated', $call('GET', '/catalog?lang=hu', null, $free));
        $save('catalog.anonymous', $call('POST', '/catalog?lang=hu', ['profile' => $demo, 'answers' => (object) [], 'saved' => []]));
        foreach ($ids as $label => $id) {
            $save("detail.$label.hu", $call('GET', "/opportunities/$id?lang=hu", null, $sub));
            $save("detail.$label.en", $call('GET', "/opportunities/$id?lang=en", null, $sub));
        }
        $save('detail.locked', $call('GET', "/opportunities/{$ids['plain']}?lang=hu", null, $free));
        $save('search.subscriber', $call('GET', '/search?sort=-score&page=1&pageSize=20&lang=hu', null, $sub));
        $save('answer.consortium', $call('POST', "/opportunities/{$ids['consortium']}/answer?lang=hu", ['field' => 'consortium_ready', 'value' => true, 'scope' => 'global'], $sub));
        $save('detail.consortium.answered.hu', $call('GET', "/opportunities/{$ids['consortium']}?lang=hu", null, $sub));
        $save('nav.taxpayer', $call('POST', '/nav/taxpayer', ['tax_number' => '12345676-2-42']));
        $save('save.toggle', $call('POST', "/opportunities/{$ids['plain']}/save", [], $sub));
        $save('profile.subscriber', $call('GET', '/profile', null, $sub));
        $save('me.subscriber', $call('GET', '/auth/me', null, $sub));
        $save('_meta', ['generatedBy' => 'php artisan fundor:generate-api-fixtures', 'referenceDate' => '2026-09-21', 'company' => $demo['company'],
            'callIds' => $chosen, 'ids' => $ids, 'note' => 'Recorded from the running API on an in-memory database. Regenerate instead of editing.']);

    }
}
