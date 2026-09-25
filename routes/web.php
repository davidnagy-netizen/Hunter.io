<?php

/**
 * Web routes: the single-page frontend.
 *
 * Every page — landing, sign-in, the app, the admin console — is the React app in `resources/js/`, which routes on the
 * client and talks to `/api/*`. So the server's only job here is to hand the built `index.html` to any browser
 * navigation that isn't an API call, so a deep link or a reload (`/admin/crm`, `/app/search`) works.
 * Build it with `npm run build` (output: `public/spa`).
 */

use Illuminate\Support\Facades\Route;

Route::get('/{path?}', function () {
    $index = config('fundor.spa_index');

    if (! is_file($index)) {
        return response("The frontend has not been built.\nRun: npm ci && npm run build\n", 503, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    return response(file_get_contents($index), 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
        // The page is a tiny shell that names hashed assets; it must never be cached, or a deploy would leave visitors on a stale build.
        'Cache-Control' => 'no-cache, must-revalidate',
    ]);
})->where('path', '^(?!api(/|$)).*$')->name('spa');
