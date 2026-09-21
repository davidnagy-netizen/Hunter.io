<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/**
 * Class OnboardingController
 *
 * Manages the onboarding wizard for setting up a company funding profile,
 * capturing industry classifications, regional coordinates, and investment targets.
 */
class OnboardingController extends Controller
{
    /**
     * Display the company funding profile onboarding wizard.
     */
    public function show(Request $request): View
    {
        $user = Auth::user();
        $existingProfile = $user ? $user->companyProfile : null;

        return view('onboarding', compact('existingProfile'));
    }

    /**
     * Save the completed company funding profile.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'employees' => ['required', 'integer', 'min:1'],
            'region_code' => ['required', 'string', 'max:10'],
            'county' => ['required', 'string', 'max:100'],
            'industry_id' => ['required', 'string', 'max:50'],
            'teaor_code' => ['required', 'string', 'max:10'],
            'revenue_band' => ['required', 'string', 'max:100'],
            'closed_business_years' => ['required', 'integer', 'min:0'],
            'goals' => ['required', 'array', 'min:1'],
            'planned_investment_value' => ['required', 'numeric', 'min:0'],
            'project_name' => ['nullable', 'string', 'max:255'],
            'de_minimis_ok' => ['nullable', 'boolean'],
        ]);

        $user = Auth::user();
        if ($user) {
            $user->companyProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $validated
            );
        }

        return redirect()->route('dashboard')->with('success', __('A cégprofil sikeresen frissítve lett.'));
    }
}
