<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/**
 * Class DashboardController
 *
 * Serves the primary SME funding dashboard displaying match statistics,
 * ranked opportunities, and urgent calendar deadlines.
 */
class DashboardController extends Controller
{
    /**
     * Display the main application dashboard.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function index(Request $request): View
    {
        $user = Auth::user();
        $profile = $user ? $user->companyProfile : null;

        // Fetch open opportunities
        $opportunities = Opportunity::open()->get();

        // Calculate summary statistics
        $stats = [
            'totalOpen' => $opportunities->count(),
            'upcomingDeadlines' => $opportunities->filter(fn ($o) => $o->daysRemaining() <= 30 && $o->daysRemaining() >= 0)->count(),
            'totalPotentialFunding' => $opportunities->sum('funding_max'),
        ];

        return view('dashboard', compact('user', 'profile', 'opportunities', 'stats'));
    }
}
