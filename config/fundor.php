<?php

$price = fn (string $key) => is_numeric(env($key)) ? max(0, (float) env($key)) : null;

return [
    'cookie_secure' => env('FUNDOR_COOKIE_SECURE', env('APP_ENV') === 'production'),
    'session_minutes' => 10080,
    // Prices are deliberately unset until configured; unknown revenue must not be invented.
    'plans' => [
        ['id' => 'trial', 'label_hu' => 'Próba', 'label_en' => 'Trial', 'days' => 14, 'status' => 'trial'],
        ['id' => 'monthly', 'label_hu' => 'Havi', 'label_en' => 'Monthly', 'days' => 30, 'status' => 'active', 'priceHUF' => $price('FUNDOR_MONTHLY_HUF')],
        ['id' => 'quarterly', 'label_hu' => 'Negyedéves', 'label_en' => 'Quarterly', 'days' => 90, 'status' => 'active', 'priceHUF' => $price('FUNDOR_QUARTERLY_HUF')],
        ['id' => 'yearly', 'label_hu' => 'Éves', 'label_en' => 'Yearly', 'days' => 365, 'status' => 'active', 'priceHUF' => $price('FUNDOR_YEARLY_HUF')],
    ],
    'catalog_feed_url' => env('FUNDOR_CATALOG_FEED_URL'),
    'eur_huf' => $price('FUNDOR_EUR_HUF'),
];
