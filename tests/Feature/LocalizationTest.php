<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_language_switch_persists_and_preserves_local_query(): void
    {
        $this->post('/locale', ['locale' => 'en', 'return_to' => '/opportunities?q=ERP'])
            ->assertRedirect('/opportunities?q=ERP')->assertSessionHas('locale', 'en');
        $this->get('/login')->assertOk()->assertSee('lang="en"', false)->assertSee('Username');
        $this->post('/locale', ['locale' => 'hu'])->assertSessionHas('locale', 'hu');
        $this->get('/login')->assertOk()->assertSee('lang="hu"', false)->assertSee('Felhasználónév');
    }

    public function test_invalid_language_and_external_redirect_are_rejected(): void
    {
        $this->withSession(['locale' => 'hu'])->post('/locale', ['locale' => 'de'])
            ->assertSessionHasErrors('locale')->assertSessionHas('locale', 'hu');
        foreach (['https://example.com', '//example.com', '/\\example.com'] as $target) {
            $this->post('/locale', ['locale' => 'en', 'return_to' => $target])->assertRedirect('/');
        }
    }

    public function test_validation_uses_selected_language(): void
    {
        $this->withSession(['locale' => 'hu'])->post('/login', [])
            ->assertSessionHasErrors(['username' => 'A(z) felhasználónév mező kitöltése kötelező.']);
        $this->withSession(['locale' => 'en'])->post('/login', [])
            ->assertSessionHasErrors(['username' => 'The username field is required.']);
    }

    public function test_grant_details_translate_without_changing_stored_content(): void
    {
        $this->seed(\Database\Seeders\OpportunitySeeder::class);
        $this->actingAs(User::factory()->create())->withSession(['locale' => 'en'])->get('/opportunities/ginop-dig')
            ->assertOk()->assertSee('Business digitalization (ERP, production management)')
            ->assertSee('Latest completed annual report')->assertSee('Grant and own contribution calculator');
        $this->withSession(['locale' => 'hu'])->get('/opportunities/ginop-dig')
            ->assertOk()->assertSee('Vállalati digitalizáció (ERP, gyártásvezérlés)');
        $this->assertDatabaseHas('opportunities', ['code' => 'ginop-dig', 'title' => 'Vállalati digitalizáció (ERP, gyártásvezérlés)']);
    }

    public function test_logout_retains_language_preference(): void
    {
        $this->actingAs(User::factory()->create())->withSession(['locale' => 'en'])
            ->post('/logout')->assertRedirect('/')->assertSessionHas('locale', 'en');
        $this->assertGuest();
        $this->get('/')->assertOk()->assertSee('lang="en"', false);
    }

    public function test_default_and_unknown_translation_fallback(): void
    {
        config(['app.locale' => 'hu']);
        $this->get('/login')->assertOk()->assertSee('lang="hu"', false);
        $this->withSession(['locale' => 'invalid'])->get('/login')->assertOk()->assertSee('lang="hu"', false);
        app()->setLocale('en');
        $this->assertSame('Custom grant title', __('Custom grant title'));
    }

    public function test_public_and_authenticated_pages_render_in_both_languages(): void
    {
        foreach (['en', 'hu'] as $locale) {
            foreach (['/', '/assessment', '/login', '/register'] as $url) {
                $this->withSession(['locale' => $locale])->get($url)->assertOk()->assertSee('lang="'.$locale.'"', false);
            }
        }
        $user = User::factory()->create(['role' => 'admin']);
        foreach (['en', 'hu'] as $locale) {
            foreach (['/dashboard', '/onboarding', '/calendar', '/favorites', '/opportunities', '/admin/dashboard', '/admin/users', '/admin/crm'] as $url) {
                $this->actingAs($user)->withSession(['locale' => $locale])->get($url)->assertOk()->assertSee('lang="'.$locale.'"', false);
            }
        }
    }
}
