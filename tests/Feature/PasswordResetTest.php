<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\PasswordResetCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/** "Forgot password?": an e-mailed 6-digit code sets a new password once, and never reveals who has an account. */
class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Notification::fake();
    }

    private function user(): User
    {
        return User::create(['name' => 'Alice', 'username' => 'alice', 'email' => 'alice@example.com', 'password' => 'old-password-123', 'role' => 'user']);
    }

    private function sentCode(User $u): string
    {
        $code = null;
        Notification::assertSentTo($u, PasswordResetCode::class, function (PasswordResetCode $n) use (&$code) {
            $code = $n->code;

            return true;
        });

        return $code;
    }

    private function reset(string $code): array
    {
        return ['email' => 'alice@example.com', 'code' => $code, 'password' => 'brand-new-password', 'password_confirmation' => 'brand-new-password'];
    }

    public function test_an_unknown_address_gets_the_same_answer_and_no_email(): void
    {
        $this->postJson('/api/auth/password/forgot', ['email' => 'nobody@example.com'])->assertOk()->assertJsonPath('success', true);
        Notification::assertNothingSent();
    }

    public function test_the_code_sets_the_new_password_once_and_signs_out_everywhere(): void
    {
        $u = $this->user();
        DB::table('api_sessions')->insert(['token_hash' => hash('sha256', 'old-session'), 'user_id' => $u->id, 'expires_at' => now()->addDay()]);
        $this->postJson('/api/auth/password/forgot', ['email' => 'Alice@Example.com'])->assertOk();
        $code = $this->sentCode($u);

        $this->postJson('/api/auth/password/reset', $this->reset($code))->assertOk();
        $this->assertDatabaseCount('api_sessions', 0);
        $this->postJson('/api/auth/login', ['username' => 'alice@example.com', 'password' => 'brand-new-password'])->assertOk();
        $this->postJson('/api/auth/password/reset', $this->reset($code))->assertStatus(422)->assertJsonPath('code', 'INVALID_CODE');
    }

    public function test_five_wrong_tries_burn_the_code(): void
    {
        $u = $this->user();
        $this->postJson('/api/auth/password/forgot', ['email' => 'alice@example.com'])->assertOk();
        $code = $this->sentCode($u);
        $wrong = $code === '000000' ? '111111' : '000000';

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/password/reset', $this->reset($wrong))->assertStatus(422);
        }
        $this->postJson('/api/auth/password/reset', $this->reset($code))->assertStatus(422)->assertJsonPath('code', 'INVALID_CODE');
        $this->assertTrue(Hash::check('old-password-123', $u->fresh()->password));
        // Asking for a new code has its own rate limit, not the one the wrong tries used up.
        $this->postJson('/api/auth/password/forgot', ['email' => 'alice@example.com'])->assertOk();
    }

    public function test_the_email_is_written_in_the_language_the_site_was_in(): void
    {
        $u = $this->user();
        $this->postJson('/api/auth/password/forgot', ['email' => 'alice@example.com'])->assertOk();
        $this->postJson('/api/auth/password/forgot?lang=en', ['email' => 'alice@example.com'])->assertOk();

        $subjects = [];
        Notification::assertSentTo($u, PasswordResetCode::class, function (PasswordResetCode $n) use ($u, &$subjects) {
            $subjects[] = $n->toMail($u)->subject;

            return true;
        });
        $this->assertSame(['Fundor – jelszó visszaállítása', 'Fundor – reset your password'], $subjects);
    }

    public function test_too_many_requests_get_a_clear_message(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/auth/password/forgot', ['email' => 'nobody@example.com'])->assertOk();
        }
        $this->postJson('/api/auth/password/forgot', ['email' => 'nobody@example.com'])
            ->assertStatus(429)->assertJsonPath('code', 'TOO_MANY_ATTEMPTS')->assertHeader('Retry-After');
    }

    public function test_a_code_expires_after_ten_minutes(): void
    {
        $u = $this->user();
        $this->postJson('/api/auth/password/forgot', ['email' => 'alice@example.com'])->assertOk();
        $code = $this->sentCode($u);

        $this->travel(11)->minutes();
        $this->postJson('/api/auth/password/reset', $this->reset($code))->assertStatus(422)->assertJsonPath('code', 'INVALID_CODE');
    }
}
