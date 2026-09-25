<?php

namespace App\Http\Controllers\Api;

use App\Models\Opportunity;
use App\Services\Accounts;
use Illuminate\Http\Request;

class LoanController
{
    public function __invoke(Request $request, Accounts $accounts)
    {
        $full = $accounts->entitlements($request->user())['explanations'];
        $query = Opportunity::loans()->open()->whereDate('effective_from_date', '<=', today())->whereDate('deadline', '>=', today());
        $categories = (clone $query)->selectRaw('instrument_type, COUNT(*) AS total')->groupBy('instrument_type')->get()->map(fn ($row) => [
            'type' => $row->instrument_type->value,
            'label' => $request->query('lang') === 'en' ? $row->instrument_type->labelEn() : $row->instrument_type->labelHu(),
            'count' => (int) $row->total,
        ])->all();

        return response()->json([
            // No personalized eligibility or ranking while CR-02's regulatory gate is closed.
            'evaluationStatus' => 'BLOCKED_PENDING_MNB_LEGAL_OPINION',
            'eligibleCount' => null,
            'availableCount' => array_sum(array_column($categories, 'count')),
            'categories' => $categories,
            'gated' => ! $full,
            'requiredTier' => 'Fundor Plus',
            'disclaimer' => $request->query('lang') === 'en'
                ? 'Outputs are informational pre-screenings, not credit recommendations. Loan eligibility and recommendations are unavailable pending the MNB legal opinion.'
                : 'Az eredmények tájékoztató jellegű előszűrések, nem hitelajánlások. A hiteljogosultság értékelése és a hitelajánlások az MNB jogi állásfoglalásáig nem érhetők el.',
            'loans' => $full ? (clone $query)->orderBy('code')->get()->map(fn (Opportunity $loan) => [
                'id' => $loan->code,
                'title' => $loan->title,
                'program' => $loan->program,
                'instrument_type' => $loan->instrument_type->value,
                'terms' => $loan->loan_terms,
                'deadline' => $loan->deadline->toDateString(),
                'effective_from_date' => $loan->effective_from_date->toDateString(),
                'source_document_reference' => $loan->source_document_reference,
                'last_verified_date' => $loan->last_verified_date->toDateString(),
            ])->all() : [],
        ]);
    }
}
