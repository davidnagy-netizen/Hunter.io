<?php

namespace App\Notifications;

use App\Services\EmailCodes;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

/** The 6-digit code for setting a new password from "Forgot password?", delivered and localised like `VerifyAccountEmail`. */
class PasswordResetCode extends Notification implements ShouldQueue
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
            ->subject($en ? 'Fundor – reset your password' : 'Fundor – jelszó visszaállítása')
            ->greeting($en ? 'Hello!' : 'Üdvözöljük!')
            ->line($en ? 'You asked to reset the password of your Fundor account. Enter this code to set a new password:'
                : 'Jelszó-visszaállítást kért a Fundor fiókjához. Az új jelszó beállításához írja be ezt a kódot:')
            ->line(new HtmlString('<p style="margin:24px 0;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#273F4F">'.$this->code.'</p>'))
            ->line($en ? 'The code is valid for '.EmailCodes::MINUTES.' minutes and can be used once.'
                : 'A kód '.EmailCodes::MINUTES.' percig érvényes, és csak egyszer használható.')
            ->line($en ? "If you didn't ask for this, ignore this email — your password won't change."
                : 'Ha nem Ön kérte, hagyja figyelmen kívül ezt a levelet — a jelszava nem változik.')
            ->salutation(new HtmlString($en ? 'Best regards,<br>the Fundor team' : 'Üdvözlettel,<br>a Fundor csapata'));
    }
}
