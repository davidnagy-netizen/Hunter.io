<?php

namespace App\Exceptions;

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
            'TAXPAYER_NOT_FOUND' => 'A megadott adószámmal nem található adózó a NAV nyilvántartásában.',
            'COMPANY_INACTIVE' => 'A vállalkozás jelenleg nem aktív a NAV nyilvántartásában.',
            'TAX_SUBJECT_SUSPENDED' => 'Az adóalany adószáma fel van függesztve.',
            'INSUFFICIENT_DATA' => 'A kért művelethez további cégadatok megadása szükséges.',
            'PENDING_REVIEW' => 'A kérelem feldolgozás alatt áll.',
            'INVALID_TAX_NUMBER' => 'Érvénytelen adószám formátum.',
            default => 'A kérés nem teljesíthető.',
        });
    }
}
