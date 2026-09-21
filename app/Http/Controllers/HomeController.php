<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Class HomeController
 *
 * Handles the public landing page, showcasing the value proposition,
 * featured grant opportunities, worked comparison example, and pricing overview.
 */
class HomeController extends Controller
{
    /**
     * Display the public landing page.
     */
    public function index(Request $request): View
    {
        // Retrieve top curated open opportunities for the landing page showcase
        $featuredOpportunities = Opportunity::open()
            ->where('curated', true)
            ->limit(3)
            ->get();

        return view('home', compact('featuredOpportunities'));
    }
}
