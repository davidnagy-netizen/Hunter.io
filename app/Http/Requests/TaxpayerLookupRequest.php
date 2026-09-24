<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\HungarianTaxNumberRule;
use Illuminate\Foundation\Http\FormRequest;

/** CR-03: reject invalid identifiers before any external request. */
class TaxpayerLookupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['tax_number' => ['bail', 'required', 'string', new HungarianTaxNumberRule]];
    }
}
