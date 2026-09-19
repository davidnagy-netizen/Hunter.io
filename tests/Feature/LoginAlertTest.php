<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_wrong_password_shows_a_translated_alert_once_and_keeps_only_username(): void
    {
        $user = User::factory()->create();
        foreach (['en' => 'Login failed', 'hu' => 'Sikertelen bejelentkezés'] as $locale => $title) {
            $response = $this->withSession(['locale' => $locale])->from('/login')->post('/login', [
                'username' => $user->username, 'password' => 'incorrect-password',
            ]);
            $response->assertRedirect('/login')->assertSessionHasErrors('username')
                ->assertSessionHas('_old_input.username', $user->username)
                ->assertSessionMissing('_old_input.password')
                ->assertSessionHas('alert.config', function ($json) use ($title) {
                    $data = json_decode($json, true);
                    $config = $data['config'] ?? $data;

                    return $config['title'] === $title && $config['icon'] === 'error'
                        && !isset($config['timer']);
                });
            $this->assertGuest();
            $this->get('/login')->assertOk()->assertSee('swalConfig', false)
                ->assertSee('vendor/sweetalert/sweet-alert.js', false)
                ->assertDontSee('role="alert"', false);
            $this->get('/login')->assertOk()->assertDontSee('swalConfig', false);
        }
    }

    public function test_successful_login_does_not_create_an_error_alert(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['username' => $user->username, 'password' => 'password'])
            ->assertRedirect('/dashboard')->assertSessionMissing('alert.config');
        $this->assertAuthenticatedAs($user);
    }
}
