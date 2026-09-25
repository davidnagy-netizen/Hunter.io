<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\User;
use App\Services\Profiles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\Support\RegistersVerifiedCompany;
use Tests\TestCase;

class ApiContractTest extends TestCase
{
    use RefreshDatabase;
    use RegistersVerifiedCompany;

    private function account(string $name = 'alice', string $role = 'user'): User
    {
        return User::create(['name' => $name, 'username' => $name, 'email' => $name.'@example.com', 'password' => 'test-password', 'role' => $role]);
    }

    private function apiSession(User $u): static
    {
        $token = bin2hex(random_bytes(32));
        DB::table('api_sessions')->insert(['token_hash' => hash('sha256', $token), 'user_id' => $u->id, 'expires_at' => now()->addDays(7)]);

        return $this->withCredentials()->withUnencryptedCookie('fundor_session', $token);
    }

    private function opportunity(): Opportunity
    {
        return Opportunity::create(['code' => 'private-call', 'program' => 'Private Programme', 'title' => 'Identifying title', 'deadline' => now()->addDays(60)->toDateString(),
            'source_reference' => 'SECRET-REF', 'source_url' => 'https://example.com/private-call', 'funding_min' => 1000000, 'funding_max' => 50000000,
            'intensity' => .5, 'goals' => ['digitalization'], 'hard_rules' => [['field' => 'de_minimis_ok', 'op' => '==', 'value' => true]], 'soft_rules' => [], 'docs' => ['Secret document']]);
    }

    public function test_all_contract_operations_return_json_shapes_for_frontend(): void
    {
        $call = function (string $method, string $uri, array $body = [], int $status = 200) {
            return $this->json($method, '/api'.$uri, $body)->assertStatus($status);
        };
        $this->opportunity();
        $call('GET', '/auth/me');
        $call('GET', '/meta');
        $p = app(Profiles::class)->demo();
        $call('GET', '/catalog');
        $call('POST', '/catalog', ['profile' => $p]);
        $call('GET', '/search');
        $call('POST', '/search', ['profile' => $p]);
        $call('GET', '/opportunities/private-call');
        $leadId = $call('POST', '/leads', ['email' => 'snapshot@example.com', 'consent' => true], 201)->json('id');
        $call('POST', '/auth/register', $this->signupPayload('snapshot@example.com'), 201);
        $call('POST', '/auth/login', ['username' => 'snapshot@example.com', 'password' => 'correct-horse-battery']);
        $u = User::where('email', 'snapshot@example.com')->first();
        $u->markEmailAsVerified();
        $this->apiSession($u);
        $call('GET', '/profile');
        $call('POST', '/profile/load-demo');
        $call('POST', '/profile', ['profile' => $p]);
        $call('GET', '/profile/history');
        $call('POST', '/profile/restore', ['version' => 1]);
        $call('POST', '/opportunities/private-call/save');
        $call('POST', '/opportunities/private-call/answer', ['field' => 'de_minimis_ok', 'value' => true]);
        $call('POST', '/opportunities/private-call/answer', ['field' => 'de_minimis_ok', 'value' => null]);
        $call('POST', '/auth/logout');
        $this->apiSession($this->account('operator', 'admin'));
        $call('GET', '/auth/me');
        $call('GET', '/catalog');
        $call('GET', '/search');
        $call('GET', '/opportunities/private-call');
        $call('GET', '/admin/overview');
        $call('GET', '/admin/users');
        $call('GET', '/admin/history?userId='.$u->id);
        $call('POST', '/admin/subscription', ['userId' => (string) $u->id, 'planId' => 'monthly']);
        $call('POST', '/admin/user', ['userId' => (string) $u->id, 'disabled' => false]);
        $call('POST', '/refresh', [], 503);
        $call('GET', '/admin/crm');
        $call('GET', '/admin/crm/contacts');
        $call('GET', '/admin/crm/leads');
        $call('GET', '/admin/crm/contact?id='.$u->id);
        $call('GET', '/admin/crm/contact?id='.$leadId);
        $call('POST', '/admin/crm/contact', ['id' => $leadId, 'stage' => 'proposal']);
        $call('POST', '/admin/crm/lead', ['id' => $leadId, 'contactName' => 'Edited']);
        $note = $call('POST', '/admin/crm/note', ['id' => $leadId, 'text' => 'Note'], 201)->json('note.id');
        $call('POST', '/admin/crm/note', ['id' => $leadId, 'noteId' => $note, 'remove' => true]);
        $task = $call('POST', '/admin/crm/task', ['id' => $leadId, 'title' => 'Task'], 201)->json('task.id');
        $call('POST', '/admin/crm/task', ['id' => $leadId, 'taskId' => $task, 'done' => true]);
        $call('POST', '/admin/crm/task', ['id' => $leadId, 'taskId' => $task, 'remove' => true]);
        $call('POST', '/admin/crm/lead', ['id' => $leadId, 'remove' => true]);
        $call('POST', '/admin/subscription', ['userId' => (string) $u->id, 'revoke' => true]);
    }

    public function test_registration_cookie_login_logout_and_errors(): void
    {
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('user', null)->assertJsonPath('entitlements.tier', 'anonymous')->assertJsonMissingPath('adminSeed');
        $this->postJson('/api/auth/register', ['username' => 'ab', 'password' => '1234'])->assertStatus(400)->assertJsonPath('code', 'INVALID_REQUEST');
        $this->postJson('/api/auth/register', ['username' => 'alice', 'password' => '123'])->assertStatus(400)->assertJsonPath('code', 'INVALID_REQUEST');
        $r = $this->postJson('/api/auth/register', $this->signupPayload());
        $r->assertCreated()->assertJsonPath('user.email', 'alice@example.com')->assertJsonPath('user.disabled', false)->assertJsonMissingPath('user.password')->assertCookie('fundor_session');
        $token = $r->getCookie('fundor_session', false)->getValue();
        $this->assertDatabaseHas('api_sessions', ['token_hash' => hash('sha256', $token)]);
        $this->withCredentials()->withUnencryptedCookie('fundor_session', $token)->getJson('/api/auth/me')->assertJsonPath('user.email', 'alice@example.com');
        $this->postJson('/api/auth/logout')->assertOk()->assertCookieExpired('fundor_session');
        $this->getJson('/api/auth/me')->assertJsonPath('user', null);
        $this->postJson('/api/auth/login', ['username' => 'alice', 'password' => 'bad'])->assertUnauthorized()->assertJsonPath('code', 'BAD_CREDENTIALS');
        $this->postJson('/api/auth/login', ['username' => 'alice@example.com', 'password' => 'correct-horse-battery'])->assertOk();
    }

    public function test_csrf_and_anonymous_writes_are_rejected(): void
    {
        $this->postJson('/api/auth/login', [], ['Origin' => 'https://attacker.example'])->assertForbidden()->assertJsonPath('code', 'CSRF_REJECTED');
        $this->post('/api/auth/login', ['username' => 'alice'])->assertStatus(415);
        foreach (['/profile', '/profile/history'] as $path) {
            $this->getJson('/api'.$path)->assertUnauthorized();
        }
        foreach (['/profile', '/profile/restore', '/opportunities/call/save', '/opportunities/call/answer', '/refresh', '/admin/user'] as $path) {
            $this->postJson('/api'.$path)->assertUnauthorized();
        }
        $this->assertDatabaseCount('api_account_states', 0);
        $this->postJson('/api/profile/load-demo')->assertOk()->assertJsonPath('profile.company', 'Alfa Gyártó Kft.');
        $this->assertDatabaseCount('company_profiles', 0);
    }

    public function test_profile_history_answers_and_saved_calls_are_account_scoped(): void
    {
        $a = $this->account();
        $b = $this->account('bob');
        $this->opportunity();
        $p = app(Profiles::class)->demo();
        $this->apiSession($a)->postJson('/api/profile', ['profile' => $p])->assertOk()->assertJsonPath('version', 1)->assertJsonPath('changed', []);
        $p['headcount'] = 42;
        $p['customField'] = 'preserved';
        $this->postJson('/api/profile', ['profile' => $p])->assertOk()->assertJsonPath('version', 2);
        $this->getJson('/api/profile/history')->assertOk()->assertJsonCount(2, 'versions')->assertJsonPath('current.customField', 'preserved');
        $this->postJson('/api/opportunities/private-call/save')->assertOk()->assertJsonPath('isSaved', true);
        $this->postJson('/api/opportunities/private-call/answer', ['field' => 'de_minimis_ok', 'value' => true, 'scope' => 'call'])->assertOk()->assertJsonPath('key', 'private-call:de_minimis_ok');
        $this->getJson('/api/profile')->assertJsonPath('answers.private-call:de_minimis_ok', true)->assertJsonPath('saved.0', 'private-call');
        $this->postJson('/api/profile/restore', ['version' => 1])->assertOk()->assertJsonPath('profile.employees', 28)->assertJsonCount(3, 'versions');
        $this->apiSession($b)->getJson('/api/profile')->assertJsonPath('profile', null)->assertJsonPath('saved', [])->assertJsonPath('versions', 0);
        $this->postJson('/api/profile/restore', ['version' => 1])->assertNotFound();
        $this->apiSession($a)->postJson('/api/opportunities/private-call/answer', ['field' => 'de_minimis_ok', 'scope' => 'call', 'value' => null])->assertOk()->assertJsonPath('value', null);
    }

    public function test_paywall_and_subscriber_search_do_not_leak_identity(): void
    {
        $this->opportunity();
        $p = app(Profiles::class)->demo();
        foreach (['/api/catalog', '/api/opportunities', '/api/opportunities/private-call', '/api/search?q=Identifying'] as $url) {
            $r = $this->getJson($url)->assertOk();
            foreach (['Identifying title', 'SECRET-REF', 'https://example.com/private-call'] as $secret) {
                $this->assertStringNotContainsString($secret, $r->getContent());
            }
        }
        $this->postJson('/api/catalog', ['profile' => $p])->assertOk()->assertJsonPath('gated', true)->assertJsonCount(1, 'teasers');
        $u = $this->account();
        $u->update(['subscription_plan' => 'monthly', 'subscription_expires_at' => now()->addDays(30)]);
        $this->apiSession($u)->getJson('/api/catalog')->assertOk()->assertJsonPath('gated', false)->assertJsonPath('opportunities.0.id', 'private-call');
        $this->postJson('/api/search?q=Identifying&lang=en', ['profile' => $p, 'answers' => ['de_minimis_ok' => true]])->assertOk()->assertJsonPath('total', 1)->assertJsonPath('results.0.verdict', 'CONDITIONAL');
        $this->postJson('/api/search?eligibleOnly=true', ['profile' => $p, 'answers' => ['de_minimis_ok' => false]])->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/search?pageSize=101')->assertStatus(400)->assertJsonPath('code', 'INVALID_REQUEST');
        $this->getJson('/api/opportunities/missing')->assertNotFound()->assertJsonPath('code', 'NO_SUCH_OPPORTUNITY');
        $u->update(['subscription_expires_at' => now()->subDay()]);
        $this->getJson('/api/catalog')->assertJsonPath('gated', true);
    }

    public function test_lead_consent_deduplication_and_conversion(): void
    {
        $this->postJson('/api/leads', ['email' => 'lead@example.com'])->assertStatus(400)->assertJsonPath('code', 'CONSENT_REQUIRED');
        $data = ['email' => 'lead@example.com', 'consent' => true, 'contactName' => 'Lead', 'readiness' => 123];
        $this->postJson('/api/leads', $data)->assertCreated()->assertJsonPath('updated', false);
        $this->postJson('/api/leads', $data + ['company' => 'Company'])->assertOk()->assertJsonPath('updated', true);
        $this->assertDatabaseCount('leads', 1);
        $this->assertDatabaseHas('leads', ['readiness_score' => 100, 'company' => 'Company']);
        $this->postJson('/api/auth/register', $this->signupPayload('lead@example.com'))->assertCreated();
        $this->assertNotNull(Lead::first()->user_id);
    }

    public function test_admin_subscription_extension_and_disabling_revokes_sessions(): void
    {
        $u = $this->account();
        $admin = $this->account('admin', 'admin');
        $this->apiSession($u)->getJson('/api/admin/users')->assertForbidden();
        $this->apiSession($admin)->postJson('/api/admin/subscription', ['userId' => (string) $u->id, 'planId' => 'monthly'])->assertOk()->assertJsonPath('user.subscription.active', true);
        $expiry = $u->fresh()->subscription_expires_at;
        $this->postJson('/api/admin/subscription', ['userId' => (string) $u->id, 'planId' => 'monthly'])->assertOk();
        $this->assertEquals($expiry->addDays(30), $u->fresh()->subscription_expires_at);
        $this->getJson('/api/admin/history?userId='.$u->id)->assertOk()->assertJsonCount(2, 'subscriptions');
        $this->postJson('/api/admin/user', ['userId' => (string) $admin->id, 'disabled' => true])->assertStatus(400)->assertJsonPath('code', 'CANNOT_DEMOTE_SELF');
        $this->postJson('/api/admin/user', ['userId' => (string) $u->id, 'disabled' => true])->assertOk();
        $this->assertDatabaseMissing('api_sessions', ['user_id' => $u->id]);
        $this->postJson('/api/auth/login', ['username' => $u->username, 'password' => 'test-password'])->assertForbidden();
        $this->getJson('/api/admin/overview')->assertOk()->assertJsonPath('stats.disabled', 1);
    }

    public function test_crm_notes_tasks_filters_csv_and_subject_isolation(): void
    {
        $a = $this->account();
        $b = $this->account('bob');
        $admin = $this->account('admin', 'admin');
        $this->apiSession($admin)->postJson('/api/admin/crm/contact', ['id' => (string) $a->id, 'stage' => 'qualified', 'tags' => ['test', 'test'], 'owner' => 'Operator'])->assertOk()->assertJsonPath('crm.tags', ['test']);
        $note = $this->postJson('/api/admin/crm/note', ['id' => (string) $a->id, 'text' => 'Called'])->assertCreated()->json('note.id');
        $this->postJson('/api/admin/crm/note', ['id' => (string) $b->id, 'noteId' => $note, 'remove' => true])->assertNotFound();
        $task = $this->postJson('/api/admin/crm/task', ['id' => (string) $a->id, 'title' => 'Follow up', 'dueAt' => now()->subDay()->toDateString()])->assertCreated()->json('task.id');
        $this->getJson('/api/admin/crm/contacts?stage=qualified&overdue=true')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('contacts.0.id', (string) $a->id);
        $this->getJson('/api/admin/crm/contact?id='.$a->id)->assertOk()->assertJsonCount(1, 'notes')->assertJsonCount(1, 'tasks');
        $this->postJson('/api/admin/crm/task', ['id' => (string) $a->id, 'taskId' => $task, 'done' => true])->assertOk();
        $this->getJson('/api/admin/crm')->assertOk()->assertJsonCount(6, 'trend')->assertJsonPath('metrics.contacts', 2)->assertJsonCount(0, 'tasks');
        $csv = $this->get('/api/admin/crm/contacts?format=csv&stage=qualified')->assertOk()->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('alice@example.com', $csv);
        $this->assertStringNotContainsString('bob@example.com', $csv);
    }

    public function test_refresh_requires_admin_and_preserves_catalog_on_failure(): void
    {
        $o = $this->opportunity();
        $admin = $this->account('admin', 'admin');
        $this->apiSession($admin)->postJson('/api/refresh')->assertStatus(503)->assertJsonPath('code', 'REFRESH_UNAVAILABLE');
        config(['fundor.catalog_feed_url' => 'https://feed.example/catalog']);
        Http::fake(['feed.example/*' => Http::sequence()->push(['opportunities' => []])->push(['opportunities' => [['id' => 'new', 'instrument_type' => 'grant', 'title' => 'New', 'program' => 'EU', 'deadline' => '2027-01-01', 'intensity' => .5, 'goals' => [], 'hard' => []]]])]);
        $this->postJson('/api/refresh')->assertStatus(502)->assertJsonPath('ok', false);
        $this->assertDatabaseHas('opportunities', ['code' => $o->code, 'status' => 'open']);
        $this->postJson('/api/refresh')->assertOk()->assertJsonPath('ok', true);
        $this->assertDatabaseHas('opportunities', ['code' => 'new', 'status' => 'open']);
    }
}
