<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Opportunity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Class AssessmentController
 *
 * Manages the top-of-funnel free grant readiness assessment flow,
 * producing an instant Readiness Score (0-100) and capturing potential leads.
 */
class AssessmentController extends Controller
{
    /**
     * Display the free assessment wizard questions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function show(Request $request): View
    {
        return view('assessment');
    }

    /**
     * Process the assessment answers, calculate readiness, and store lead capture.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View|\Illuminate\Http\RedirectResponse
     */
    public function submit(Request $request): View|RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'employees' => ['required', 'numeric', 'min:0'],
            'revenue_band' => ['required', 'string'],
            'closed_years' => ['required', 'numeric', 'min:0'],
            'goals' => ['nullable', 'array'],
        ]);

        // Calculate a deterministic baseline readiness score from company attributes
        $score = 50;
        if ((int) $validated['employees'] >= 5) {
            $score += 15;
        }
        if ((int) $validated['closed_years'] >= 2) {
            $score += 20;
        }
        if (!empty($validated['goals'])) {
            $score += 15;
        }
        $readinessScore = min(100, $score);

        // Record the prospect as a new CRM lead
        $lead = Lead::create([
            'company' => $validated['company_name'],
            'contact_name' => $validated['company_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'stage' => 'lead',
            'readiness_score' => $readinessScore,
            'answers' => $validated,
            'source' => 'assessment',
        ]);

        // Retrieve teaser opportunities for display
        $teaserOpportunities = Opportunity::open()->limit(3)->get();

        return view('assessment', [
            'readinessScore' => $readinessScore,
            'teaserOpportunities' => $teaserOpportunities,
            'completed' => true,
        ]);
    }
}
