<?php

namespace Tests\Feature;

use App\Models\CompanyProfile;
use App\Models\Opportunity;
use App\Models\User;
use App\Services\Profiles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** An account keeps up to two company profiles (more once an admin unlocks them) and works on one at a time. */
class CompanyProfilesTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $name = 'alice', string $role = 'user'): User
    {
        return User::create(['name' => $name, 'username' => $name, 'email' => $name.'@example.com', 'password' => 'test-password', 'role' => $role]);
    }

    private function apiSession(User $u): static
    {
        $token = bin2hex(random_bytes(32));
        DB::table('api_sessions')->insert(['token_hash' => hash('sha256', $token), 'user_id' => $u->id, 'expires_at' => now()->addDay()]);

        return $this->withCredentials()->withUnencryptedCookie('fundor_session', $token);
    }

    /** An account with its first company, as registration leaves it. */
    private function withFirstCompany(): User
    {
        $u = $this->account();
        app(Profiles::class)->save($u, app(Profiles::class)->demo(), 'registration');

        return $u->fresh();
    }

    private function newCompany(string $name): array
    {
        return ['profile' => ['company' => $name] + app(Profiles::class)->demo()];
    }

    public function test_a_second_company_is_free_and_becomes_the_active_one(): void
    {
        $u = $this->withFirstCompany();

        $this->apiSession($u)->postJson('/api/profile/new', $this->newCompany('Béta Kft.'))->assertCreated()->assertJsonPath('version', 1);

        $me = $this->getJson('/api/auth/me')->assertOk();
        $me->assertJsonPath('user.profileLimit', 2)->assertJsonCount(2, 'user.companies');
        $this->assertSame([false, true], array_column($me->json('user.companies'), 'active'));
        $this->getJson('/api/profile')->assertOk()->assertJsonPath('profile.company', 'Béta Kft.')->assertJsonPath('versions', 1);
    }

    public function test_saved_calls_belong_to_the_company_and_follow_a_switch(): void
    {
        Opportunity::create(['code' => 'call-1', 'program' => 'P', 'title' => 'Call one', 'deadline' => now()->addDays(60)->toDateString(),
            'source_reference' => 'REF', 'funding_min' => 0, 'funding_max' => 0, 'intensity' => .5, 'goals' => [], 'hard_rules' => [], 'soft_rules' => [], 'docs' => []]);
        $u = $this->withFirstCompany();
        $first = (string) $u->active_profile_id;
        $this->apiSession($u)->postJson('/api/opportunities/call-1/save')->assertOk();

        $this->postJson('/api/profile/new', $this->newCompany('Béta Kft.'))->assertCreated();
        $this->getJson('/api/profile')->assertJsonPath('saved', []);

        $this->postJson('/api/profile/switch', ['id' => $first])->assertOk()->assertJsonPath('user.companies.0.active', true);
        $this->getJson('/api/profile')->assertJsonPath('saved', ['call-1'])->assertJsonPath('profile.company', 'Alfa Gyártó Kft.');
    }

    public function test_a_third_company_needs_an_admin_to_raise_the_limit(): void
    {
        $u = $this->withFirstCompany();
        $this->apiSession($u)->postJson('/api/profile/new', $this->newCompany('Béta Kft.'))->assertCreated();

        $this->postJson('/api/profile/new', $this->newCompany('Gamma Kft.'))->assertForbidden()->assertJsonPath('code', 'PROFILE_LIMIT_REACHED');
        $this->assertSame(2, $u->companyProfiles()->count());

        $this->apiSession($this->account('operator', 'admin'))->postJson('/api/admin/user', ['userId' => (string) $u->id, 'profileLimit' => 3])
            ->assertOk()->assertJsonPath('user.profileLimit', 3);
        $this->apiSession($u)->postJson('/api/profile/new', $this->newCompany('Gamma Kft.'))->assertCreated();
        $this->assertSame(3, $u->companyProfiles()->count());
    }

    public function test_only_the_accounts_own_companies_can_be_chosen(): void
    {
        $other = CompanyProfile::create(['user_id' => $this->account('bob')->id, 'company_name' => 'Bob Kft.', 'region_code' => '', 'county' => '',
            'industry_id' => '', 'goals' => []]);
        $u = $this->withFirstCompany();

        $this->apiSession($u)->postJson('/api/profile/switch', ['id' => (string) $other->id])->assertNotFound()->assertJsonPath('code', 'NO_SUCH_PROFILE');
    }

    public function test_a_company_created_outside_the_api_is_used_until_another_is_chosen(): void
    {
        $u = $this->account();
        $seeded = CompanyProfile::create(['user_id' => $u->id, 'company_name' => 'Seeded Kft.', 'region_code' => '', 'county' => '', 'industry_id' => '', 'goals' => []]);

        $this->assertNull($u->fresh()->active_profile_id);
        $this->assertSame($seeded->id, $u->fresh()->companyProfile->id);
    }
}
