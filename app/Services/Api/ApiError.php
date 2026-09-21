<?php

namespace App\Services\Api;

use RuntimeException;

class ApiError extends RuntimeException
{
    public function __construct(public string $errorCode, public int $status = 400, string $message = '')
    {
        parent::__construct($message ?: match ($errorCode) {
            'LOGIN_REQUIRED' => 'Bejelentkezés szükséges.',
            'ADMIN_REQUIRED' => 'Adminisztrátori jogosultság szükséges.',
            'BAD_CREDENTIALS' => 'Hibás felhasználónév vagy jelszó.',
            'ACCOUNT_DISABLED' => 'A fiók le van tiltva.',
            'CONSENT_REQUIRED' => 'Hozzájárulás szükséges.',
            'INVALID_EMAIL' => 'Érvénytelen e-mail cím.',
            'EMAIL_REQUIRED' => 'E-mail cím szükséges.',
            'WEAK_PASSWORD' => 'A jelszó legalább 4 karakter legyen.',
            'USERNAME_TAKEN' => 'Ez a felhasználónév már foglalt.',
            default => 'A kérés nem teljesíthető.',
        });
    }
}
