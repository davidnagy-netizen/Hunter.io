<?php

return [
    'required' => 'A(z) :attribute mező kitöltése kötelező.',
    'string' => 'A(z) :attribute mező szöveg kell legyen.',
    'email' => 'A(z) :attribute mezőben érvényes e-mail-címet adjon meg.',
    'integer' => 'A(z) :attribute mező egész szám kell legyen.',
    'numeric' => 'A(z) :attribute mező szám kell legyen.',
    'array' => 'A(z) :attribute mezőnek listának kell lennie.',
    'boolean' => 'A(z) :attribute mező értéke igaz vagy hamis lehet.',
    'confirmed' => 'A(z) :attribute megerősítése nem egyezik.',
    'unique' => 'A(z) :attribute már foglalt.',
    'in' => 'A kiválasztott :attribute érvénytelen.',
    'exists' => 'A kiválasztott :attribute érvénytelen.',
    'min' => [
        'string' => 'A(z) :attribute legalább :min karakter hosszú legyen.',
        'numeric' => 'A(z) :attribute legalább :min legyen.',
        'array' => 'A(z) :attribute legalább :min elemet tartalmazzon.',
    ],
    'max' => [
        'string' => 'A(z) :attribute legfeljebb :max karakter hosszú lehet.',
        'numeric' => 'A(z) :attribute legfeljebb :max lehet.',
        'array' => 'A(z) :attribute legfeljebb :max elemet tartalmazhat.',
    ],
    'attributes' => [
        'name' => 'név', 'username' => 'felhasználónév', 'password' => 'jelszó',
        'email' => 'e-mail-cím', 'company' => 'cégnév', 'company_name' => 'cégnév',
        'phone' => 'telefonszám', 'employees' => 'létszám', 'closed_years' => 'lezárt üzleti évek száma',
        'closed_business_years' => 'lezárt üzleti évek száma', 'revenue_band' => 'árbevétel sáv',
        'region_code' => 'régió', 'county' => 'vármegye', 'industry_id' => 'iparág',
        'teaor_code' => 'TEÁOR kód', 'planned_investment_value' => 'beruházás összege',
        'project_name' => 'projekt megnevezése', 'goals' => 'fejlesztési célok',
        'locale' => 'nyelv', 'stage' => 'státusz', 'contact_name' => 'kapcsolattartó neve',
    ],
];
