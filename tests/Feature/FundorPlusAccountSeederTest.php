<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class FundorPlusAccountSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_username_accounts_get_yearly_access_and_reruns_preserve_account_changes(): void
    {
        $this->travelTo(Carbon::parse('2027-03-01 12:00:00', 'UTC'));
        $this->seed(DatabaseSeeder::class);

        foreach (['btamas' => 'tamas123', 'istvan' => 'istvan123'] as $username => $password) {
            $this->postJson('/api/auth/login', ['username' => $username, 'password' => $password])
                ->assertOk()
                ->assertCookie('fundor_session')
                ->assertJsonPath('user.username', $username)
                ->assertJsonPath('user.role', 'user')
                ->assertJsonPath('user.subscription.plan', 'yearly')
                ->assertJsonPath('user.subscription.status', 'active')
                ->assertJsonPath('user.subscription.active', true)
                ->assertJsonPath('user.subscription.validUntil', '2028-02-29T12:00:00.000000Z')
                ->assertJsonPath('user.entitlements.tier', 'subscriber')
                ->assertJsonPath('user.entitlements.admin', false);
        }

        $btamas = User::where('username', 'btamas')->firstOrFail();
        $istvan = User::where('username', 'istvan')->firstOrFail();
        $admin = User::where('username', 'a')->firstOrFail();
        $btamas->update(['password' => 'changed-btamas-test-password']);
        $istvan->update(['subscription_expires_at' => now()->addDays(14), 'disabled' => true]);
        $accounts = [$btamas, $istvan, $admin];
        $this->travel(2)->days();
        $this->seed(DatabaseSeeder::class);

        foreach ($accounts as $account) {
            $seeded = User::where('username', $account->username)->firstOrFail();
            $this->assertSame($account->id, $seeded->id);
            $this->assertSame($account->subscription_expires_at->toISOString(), $seeded->subscription_expires_at->toISOString());
        }

        $this->postJson('/api/auth/login', ['username' => 'btamas', 'password' => 'tamas123'])
            ->assertUnauthorized()->assertJsonPath('code', 'BAD_CREDENTIALS');
        $this->postJson('/api/auth/login', ['username' => 'btamas', 'password' => 'changed-btamas-test-password'])
            ->assertOk()->assertJsonPath('user.username', 'btamas');
        $this->postJson('/api/auth/login', ['username' => 'istvan', 'password' => 'istvan123'])
            ->assertForbidden()->assertJsonPath('code', 'ACCOUNT_DISABLED');
    }
}
