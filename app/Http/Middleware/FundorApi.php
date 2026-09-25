<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Exceptions\ApiError;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class FundorApi
{
    public function handle(Request $request, Closure $next)
    {
        try {
            // A JSON-only mutation protocol plus same-origin browser checks prevents form/login CSRF.
            if (! $request->isMethodSafe()) {
                $origin = $request->headers->get('Origin') ?: $request->headers->get('Referer');
                if ($request->headers->get('Sec-Fetch-Site') === 'cross-site' || ($origin && $this->origin($origin) !== $this->origin($request->getSchemeAndHttpHost()))) {
                    throw new ApiError('CSRF_REJECTED', 403);
                }
                if (! $request->isJson()) {
                    throw new ApiError('JSON_REQUIRED', 415);
                }
            }
            $token = $request->cookie('fundor_session');
            $session = is_string($token) ? DB::table('api_sessions')->where('token_hash', hash('sha256', $token))->where('expires_at', '>', now())->first() : null;
            $user = $session ? User::find($session->user_id) : null;
            if ($user?->disabled) {
                DB::table('api_sessions')->where('user_id', $user->id)->delete();
                throw new ApiError('ACCOUNT_DISABLED', 403);
            }
            $request->setUserResolver(fn () => $user);
            if ($user?->verification_required && ! $user->hasVerifiedEmail()
                && ! $request->is('api/auth/*', 'api/v1/account', 'api/v1/account/*')) {
                throw new ApiError('EMAIL_VERIFICATION_REQUIRED', 403);
            }
            $response = $next($request);
            if ($session && ! in_array($request->path(), ['api/auth/login', 'api/auth/register', 'api/auth/logout'])) {
                DB::table('api_sessions')->where('token_hash', $session->token_hash)->update(['expires_at' => now()->addMinutes(config('fundor.session_minutes'))]);
                $response->headers->setCookie(cookie('fundor_session', $token, config('fundor.session_minutes'), '/', null, config('fundor.cookie_secure'), true, false, 'lax'));
            }
        } catch (ApiError $e) {
            $response = response()->json(['error' => $e->getMessage(), 'code' => $e->errorCode], $e->status);
        } catch (ValidationException $e) {
            $response = response()->json(['error' => 'Érvénytelen adatok.', 'code' => 'INVALID_REQUEST', 'fields' => $e->errors()], 400);
        } catch (HttpExceptionInterface $e) {
            $response = response()->json(['error' => 'A kérés nem teljesíthető.', 'code' => 'INVALID_REQUEST'], $e->getStatusCode());
        }
        $response->headers->set('Cache-Control', 'private, no-store');
        $response->headers->set('Vary', 'Cookie, Accept-Encoding');
        if ($response instanceof JsonResponse && strlen($response->getContent()) > 1024 && in_array('gzip', $request->getEncodings(), true) && function_exists('gzencode')) {
            $response->setContent(gzencode($response->getContent()));
            $response->headers->set('Content-Encoding', 'gzip');
        }

        return $response;
    }

    private function origin(string $url): string
    {
        $p = parse_url($url);

        return strtolower(($p['scheme'] ?? '').'://'.($p['host'] ?? '').':'.($p['port'] ?? (($p['scheme'] ?? '') === 'https' ? 443 : 80)));
    }
}
