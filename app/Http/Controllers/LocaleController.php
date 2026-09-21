<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', Rule::in(array_keys(config('localization.locales')))],
            'return_to' => ['nullable', 'string'],
        ]);
        $request->session()->put('locale', $validated['locale']);
        $target = $validated['return_to'] ?? '/';
        // Only allow local paths, including the original query string.
        if (! str_starts_with($target, '/') || str_starts_with($target, '//') || preg_match('/[\\\\\x00-\x20]/', $target)) {
            $target = '/';
        }

        return redirect($target);
    }
}
