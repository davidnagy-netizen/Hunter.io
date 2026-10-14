<?php

namespace App\Notifications;

use App\Services\EmailCodes;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

/**
 * The 6-digit code that confirms a new account's e-mail address, delivered by the configured queue worker and mailer.
 * Written in the language the site was in (`->locale('en')`; Hungarian otherwise).
 */
class VerifyAccountEmail extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $code) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $en = $this->locale === 'en';

        return (new MailMessage)
            ->subject($en ? 'Fundor – confirm your email address' : 'Fundor – e-mail-cím megerősítése')
            ->greeting($en ? 'Hello!' : 'Üdvözöljük!')
            ->line($en ? 'Thank you for registering. To confirm your email address, enter this code on the Fundor site:'
                : 'Köszönjük a regisztrációt. Az e-mail-címe megerősítéséhez írja be ezt a kódot a Fundor oldalán:')
            ->line(new HtmlString('<p style="margin:24px 0;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#0B1F3A">'.$this->code.'</p>'))
            ->line($en ? 'The code is valid for '.EmailCodes::MINUTES.' minutes and can be used once.'
                : 'A kód '.EmailCodes::MINUTES.' percig érvényes, és csak egyszer használható.')
            ->line($en ? "If you didn't register, please ignore this email." : 'Ha nem Ön regisztrált, hagyja figyelmen kívül ezt a levelet.')
            ->salutation(new HtmlString($en ? 'Best regards,<br>the Fundor team' : 'Üdvözlettel,<br>a Fundor csapata'));
    }
}
