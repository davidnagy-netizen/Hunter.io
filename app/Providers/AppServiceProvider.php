<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Class AppServiceProvider
 *
 * Core service provider for registering application services, bindings,
 * and bootstrapping domain event listeners or model configurations.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind abstract services or singletons into the container if needed
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure global Eloquent policies, pagination, or schema defaults
    }
}
