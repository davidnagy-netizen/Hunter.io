<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiError;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeadController
{
    public function store(Request $r, \App\Actions\Leads\CaptureLead $action)
    {
        if (! $r->filled('email')) {
            throw new ApiError('EMAIL_REQUIRED');
        }
        if (Validator::make($r->only('email'), ['email' => 'required|email|max:200'])->fails()) {
            throw new ApiError('INVALID_EMAIL');
        }
        if ($r->input('consent') !== true) {
            throw new ApiError('CONSENT_REQUIRED');
        }
        $r->validate(['company' => 'sometimes|nullable|string|max:120', 'contactName' => 'sometimes|nullable|string|max:120', 'phone' => 'sometimes|nullable|string|max:40',
            'note' => 'sometimes|nullable|string|max:500', 'readiness' => 'sometimes|numeric', 'answers' => 'sometimes|array', 'profile' => 'sometimes|array', 'matchIds' => 'sometimes|array|max:5', 'matchIds.*' => 'string']);
        $result = $action->execute($r->all());

        return response()->json($result, $result['updated'] ? 200 : 201);
    }
}
