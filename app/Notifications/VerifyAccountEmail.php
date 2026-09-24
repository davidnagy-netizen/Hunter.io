<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

/** Native Laravel signed verification, delivered by the configured queue worker. */
class VerifyAccountEmail extends VerifyEmail implements ShouldQueue
{
    use Queueable;
}
