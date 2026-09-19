<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        // When deployed to production, automatically defaults to Hungarian ('hu').
        // In local development / initial preview, defaults to English ('en') first.
        // In testing, respects config('app.locale').
        $defaultLocale = app()->environment('production')
            ? 'hu'
            : (app()->environment('testing') ? config('app.locale', 'hu') : 'en');

        $locale = $request->session()->get('locale', $defaultLocale);
        app()->setLocale(array_key_exists($locale, config('localization.locales')) ? $locale : 'hu');
        return $next($request);
    }
}
