<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\View\View;
use RealRashid\SweetAlert\Facades\Alert;

/**
 * Class AuthController
 *
 * Handles user authentication (login, registration, session termination, password updates).
 */
class AuthController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm(): View
    {
        return view('auth.login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password']], $request->boolean('remember'))) {
            $request->session()->regenerate();

            /** @var User $user */
            $user = Auth::user();
            $user->update(['last_login_at' => now()]);

            return redirect()->intended(route('dashboard'));
        }

        Alert::error(__('auth.login_failed'), __('A megadott bejelentkezési adatok nem érvényesek.'))
            ->showConfirmButton(__('auth.try_again'))
            ->buttonsStyling(false)
            ->customClass(['confirmButton' => 'btn btn-gold', 'popup' => 'fundor-alert']);

        return back()->withErrors([
            'username' => __('A megadott bejelentkezési adatok nem érvényesek.'),
        ])->onlyInput('username');
    }

    /**
     * Show the registration form.
     */
    public function showRegisterForm(): View
    {
        return view('auth.register');
    }

    /**
     * Handle registration of a new user account.
     */
    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'company' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'company' => $validated['company'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'last_login_at' => now(),
        ]);

        Auth::login($user);

        return redirect()->route('onboarding');
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request): RedirectResponse
    {
        $locale = $request->session()->get('locale', config('app.locale'));
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
        $request->session()->put('locale', $locale);

        return redirect()->route('home');
    }
}
