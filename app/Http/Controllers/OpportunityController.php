<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/**
 * Class OpportunityController
 *
 * Manages the grant catalog: search, filtering, detailed scoring breakdown,
 * interactive funding calculator, and missing rule question resolution.
 */
class OpportunityController extends Controller
{
    /**
     * Display a listing of funding opportunities with optional search filters.
     */
    public function index(Request $request): View
    {
        $query = Opportunity::query();

        // Optional full-text or program search
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('program', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Filter by program family
        if ($program = $request->query('program')) {
            $query->where('program', $program);
        }

        $opportunities = $query->orderBy('deadline', 'asc')->paginate(15);

        return view('opportunities.index', compact('opportunities'));
    }

    /**
     * Display the specified opportunity with detailed score breakdown and grant calculator.
     */
    public function show(string $code): View
    {
        $opportunity = Opportunity::where('code', $code)->firstOrFail();
        $user = Auth::user();
        $profile = $user ? $user->companyProfile : null;

        return view('opportunities.show', compact('opportunity', 'profile'));
    }

    /**
     * Resolve a missing data question directly from the opportunity detail view.
     */
    public function answerQuestion(Request $request, string $code): RedirectResponse
    {
        $validated = $request->validate([
            'field' => ['required', 'string'],
            'value' => ['required'],
        ]);

        $user = Auth::user();
        if ($user && $user->companyProfile) {
            $field = $validated['field'];
            $profile = $user->companyProfile;
            $profile->{$field} = $validated['value'];
            $profile->save();
        }

        return redirect()->route('opportunities.show', $code)
            ->with('success', __('A válasz sikeresen rögzítve lett a cégprofilban.'));
    }
}
