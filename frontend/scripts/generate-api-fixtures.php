<?php

/**
 * Records real responses of the Laravel API into frontend/src/test/fixtures/api/*.json, so the frontend's tests run on
 * what the backend actually sends (and a test checks them against ../openapi.yaml), not on hand-written guesses.
 *
 *   php frontend/scripts/generate-api-fixtures.php
 *
 * It boots the application on a THROWAWAY in-memory SQLite database (nothing in your dev database is read or written),
 * imports 12 real EU calls from tests/Fixtures/scoring/catalog.json, creates a subscriber and a free account *in that
 * throwaway database*, and calls the endpoints through the HTTP kernel with the reference date pinned to 2026-09-21.
 */
$root = dirname(__DIR__, 2);
$out = __DIR__.'/../src/test/fixtures/api';

putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=:memory:');
putenv('CACHE_STORE=array');
putenv('SESSION_DRIVER=array');
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = ':memory:';
$_ENV['CACHE_STORE'] = 'array';
$_ENV['SESSION_DRIVER'] = 'array';

require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
Illuminate\Support\Carbon::setTestNow(Illuminate\Support\Carbon::parse('2026-09-21 12:00:00', 'UTC'));
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);

use App\Models\Opportunity;
use App\Models\User;
use App\Services\Api\CatalogRefresh;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$http = $app->make(Illuminate\Contracts\Http\Kernel::class);

/** Calls the API like a browser on the same origin would. */
$call = function (string $method, string $uri, ?array $body = null, ?string $token = null) use ($http): array {
    $request = Request::create('http://localhost/api'.$uri, $method, [], $token ? ['hunter_session' => $token] : [], [], [
        'HTTP_ACCEPT' => 'application/json', 'HTTP_ORIGIN' => 'http://localhost', 'CONTENT_TYPE' => 'application/json',
    ], $body === null ? null : json_encode($body));
    $response = $http->handle($request);
    $http->terminate($request, $response);
    if ($response->getStatusCode() >= 400) {
        fwrite(STDERR, "FAILED $method $uri -> {$response->getStatusCode()} {$response->getContent()}\n");
        exit(1);
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
    echo "  $name.json\n";
};

// 1. Load the calls (all 48, then keep 12 that cover the cases the screens branch on).
$calls = json_decode(file_get_contents($root.'/tests/Fixtures/scoring/catalog.json'), true);
foreach ($calls as &$c) {
    $c['status'] = 'open';
}
unset($c);
config(['fundor.catalog_feed_url' => 'https://feed.example/catalog.json']);
Http::fake(['feed.example/*' => Http::response(['opportunities' => $calls])]);
app(CatalogRefresh::class)->run();

$demo = app(App\Services\Api\Profiles::class)->demo();
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
echo "writing to src/test/fixtures/api:\n";
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
$save('save.toggle', $call('POST', "/opportunities/{$ids['plain']}/save", [], $sub));
$save('profile.subscriber', $call('GET', '/profile', null, $sub));
$save('me.subscriber', $call('GET', '/auth/me', null, $sub));
$save('_meta', ['generatedBy' => 'frontend/scripts/generate-api-fixtures.php', 'referenceDate' => '2026-09-21', 'company' => $demo['company'],
    'callIds' => $chosen, 'ids' => $ids, 'note' => 'Recorded from the running API on an in-memory database. Regenerate instead of editing.']);
