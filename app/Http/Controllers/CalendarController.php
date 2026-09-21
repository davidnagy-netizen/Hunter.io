<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Class CalendarController
 *
 * Renders the chronological grant deadline calendar, grouping upcoming
 * submission cutoffs by month with urgency warnings.
 */
class CalendarController extends Controller
{
    /**
     * Display the chronological grant deadlines calendar.
     */
    public function index(Request $request): View
    {
        $opportunities = Opportunity::open()
            ->orderBy('deadline', 'asc')
            ->get();

        // Group opportunities by year and month
        $grouped = $opportunities->groupBy(function ($opp) {
            return $opp->deadline->format('Y-m');
        });

        return view('calendar', compact('grouped'));
    }
}
