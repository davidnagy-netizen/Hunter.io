<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Class CrmController
 *
 * Manages lead capture, CRM pipeline stage progression, and contact CSV exports.
 */
class CrmController extends Controller
{
    /**
     * Display the CRM pipeline management board.
     */
    public function index(Request $request): View
    {
        $leads = Lead::orderBy('created_at', 'desc')->get();
        $groupedLeads = $leads->groupBy('stage');

        return view('admin.crm', compact('leads', 'groupedLeads'));
    }

    /**
     * Store a newly created lead from API or web form.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'contact_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'note' => ['nullable', 'string', 'max:1000'],
            'readiness_score' => ['nullable', 'integer'],
        ]);

        $lead = Lead::create([
            ...$validated,
            'stage' => 'lead',
            'source' => 'web_inquiry',
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'lead' => $lead], 201);
        }

        return back()->with('success', __('Érdeklődés sikeresen rögzítve.'));
    }

    /**
     * Update the pipeline stage for a lead.
     */
    public function updateStage(Request $request, Lead $lead): RedirectResponse
    {
        $validated = $request->validate([
            'stage' => ['required', 'string', 'in:lead,contacted,qualified,converted,dormant'],
        ]);

        $lead->update(['stage' => $validated['stage']]);

        return back()->with('success', __('Érdeklődő státusza frissítve.'));
    }

    /**
     * Export all contacts and leads as a downloadable CSV.
     */
    public function exportCsv(): StreamedResponse
    {
        $fileName = 'fundor_leads_'.date('Y-m-d').'.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', __('Név'), 'Email', __('Cég'), __('Telefon'), __('Státusz'), __('Readiness Pont'), __('Dátum')]);

            Lead::chunk(100, function ($leads) use ($handle) {
                foreach ($leads as $lead) {
                    fputcsv($handle, [
                        $lead->id,
                        $lead->contact_name,
                        $lead->email,
                        $lead->company,
                        $lead->phone,
                        $lead->stage,
                        $lead->readiness_score,
                        $lead->created_at->toIso8601String(),
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, ['Content-Type' => 'text/csv']);
    }
}
