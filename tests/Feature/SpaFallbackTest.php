<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * The React frontend is the whole website: Laravel hands its built index.html to every browser navigation that is
 * not an API call, and leaves /api/* alone.
 */
class SpaFallbackTest extends TestCase
{
    use RefreshDatabase;

    private string $index;

    protected function setUp(): void
    {
        parent::setUp();
        $dir = sys_get_temp_dir().'/fundor-spa-'.bin2hex(random_bytes(4));
        File::ensureDirectoryExists($dir);
        $this->index = $dir.'/index.html';
        config(['fundor.spa_index' => $this->index]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory(dirname($this->index));
        parent::tearDown();
    }

    private function build(string $html = '<!doctype html><title>Fundor</title><div id="root"></div>'): void
    {
        file_put_contents($this->index, $html);
    }

    public function test_the_root_serves_the_built_frontend(): void
    {
        $this->build();
        $this->get('/')->assertOk()->assertSee('<div id="root">', false)->assertHeader('Content-Type', 'text/html; charset=UTF-8');
    }

    public function test_client_side_routes_serve_the_same_page_so_deep_links_and_reloads_work(): void
    {
        $this->build();
        foreach (['/login', '/register', '/onboarding', '/app', '/app/opportunities/eu-life-2026', '/admin', '/admin/crm/contact/u1', '/assess'] as $path) {
            $this->get($path)->assertOk()->assertSee('<div id="root">', false);
        }
    }

    public function test_the_shell_is_never_cached_so_a_deploy_cannot_leave_visitors_on_a_stale_build(): void
    {
        $this->build();
        $this->get('/')->assertHeader('Cache-Control', 'must-revalidate, no-cache, private');
    }

    public function test_an_unknown_api_url_is_a_json_404_not_the_frontend(): void
    {
        $this->build();
        $response = $this->getJson('/api/definitely-not-a-route');
        $response->assertNotFound();
        $this->assertStringNotContainsString('<div id="root">', $response->getContent());
    }

    public function test_the_api_is_not_shadowed_by_the_fallback(): void
    {
        $this->build();
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('user', null);
        $this->getJson('/api/health')->assertOk()->assertJsonPath('status', 'healthy');
    }

    public function test_a_missing_build_says_how_to_make_one_instead_of_a_blank_page(): void
    {
        $this->get('/')->assertStatus(503)->assertSee('npm --prefix frontend', false);
    }

    public function test_only_reads_are_answered_with_the_page(): void
    {
        $this->build();
        $this->post('/login', [])->assertStatus(405);
    }
}
