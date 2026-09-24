<?php

// Expired signup capabilities contain no taxpayer payload and have no further purpose.
Schedule::call(fn () => DB::table('signup_sessions')->where('expires_at', '<=', now())->delete())->hourly();

/**
 * Console Routes Definition.
 *
 * This file is where you may define all of your Closure based console commands.
 * Each Closure is bound to a command instance allowing a simple approach interacting
 * with each command's IO methods.
 */

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
