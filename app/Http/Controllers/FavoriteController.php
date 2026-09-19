<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Class FavoriteController
 *
 * Manages saved / bookmarked opportunities for authenticated users.
 */
class FavoriteController extends Controller
{
    /**
     * Display the list of saved opportunities.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function index(Request $request): View
    {
        // For boilerplate demonstration, fetch saved IDs from session or user relation
        $savedIds = session()->get('favorite_opportunities', []);
        $favorites = Opportunity::whereIn('id', $savedIds)->get();

        return view('favorites', compact('favorites'));
    }

    /**
     * Toggle the bookmark status of an opportunity.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function toggle(Request $request, int $id): RedirectResponse
    {
        $savedIds = session()->get('favorite_opportunities', []);

        if (in_array($id, $savedIds)) {
            $savedIds = array_diff($savedIds, [$id]);
            $message = __('Lehetőség eltávolítva a mentettek közül.');
        } else {
            $savedIds[] = $id;
            $message = __('Lehetőség elmentve a kedvencekhez.');
        }

        session()->put('favorite_opportunities', array_values($savedIds));

        return back()->with('success', $message);
    }
}
