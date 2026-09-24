<?php

/** Operator technical-user credentials must never reach browser clients. */
return [
    'base_url' => env('NAV_BASE_URL', 'https://api-test.onlineszamla.nav.gov.hu/invoiceService/v3'),
    'login' => env('NAV_LOGIN'),
    'password' => env('NAV_PASSWORD'),
    'tax_number' => env('NAV_TAX_NUMBER'),
    'signature_key' => env('NAV_SIGNATURE_KEY'),
    'software_id' => env('NAV_SOFTWARE_ID'),
    'developer_name' => env('NAV_DEVELOPER_NAME'),
    'developer_contact' => env('NAV_DEVELOPER_CONTACT'),
];
