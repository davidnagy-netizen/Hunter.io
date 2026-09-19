<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GrassfeldTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the Grassfeld landing page renders successfully with all core modules.
     */
    public function test_grassfeld_landing_page_renders_successfully(): void
    {
        $response = $this->get('/grassfeld');

        $response->assertStatus(200);
        $response->assertSee('Grassfeld');
        $response->assertSee('Keep your finances on track with effortless peace of mind.');
        $response->assertSee('Monthly Safe-to-Spend Balance');
        $response->assertSee('Eight integrated tools. One quiet dashboard.');
        $response->assertSee('Fixed Needs (50%)');
        $response->assertSee('Can Grassfeld move money or execute transfers from my bank accounts?');
    }
}
