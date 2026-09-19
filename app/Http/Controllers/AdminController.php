<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Class AdminController
 *
 * Provides system administrative monitoring, user management, and operational health metrics.
 */
class AdminController extends Controller
{
    /**
     * Display the administrative overview dashboard.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function dashboard(Request $request): View
    {
        $stats = [
            'totalUsers' => User::count(),
            'activeSubscriptions' => User::whereNotNull('subscription_expires_at')
                ->where('subscription_expires_at', '>', now())
                ->count(),
            'totalOpportunities' => Opportunity::count(),
            'openOpportunities' => Opportunity::open()->count(),
            'totalLeads' => Lead::count(),
        ];

        $recentUsers = User::latest()->limit(5)->get();
        $recentLeads = Lead::latest()->limit(5)->get();

        return view('admin.dashboard', compact('stats', 'recentUsers', 'recentLeads'));
    }

    /**
     * Display user administration list.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function users(Request $request): View
    {
        $users = User::with('companyProfile')->paginate(20);

        return view('admin.users', compact('users'));
    }

    /**
     * API health status endpoint.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'service' => 'Fundor.hu Laravel API',
            'version' => '13.0.0-boilerplate',
            'catalog' => [
                'total' => Opportunity::count(),
                'open' => Opportunity::open()->count(),
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
